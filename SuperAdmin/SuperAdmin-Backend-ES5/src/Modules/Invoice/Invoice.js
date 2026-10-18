const AccountNumbers = require("../../../Database/models/AccountNumbers");
const Transaction_AccountNumbers = require("../../../Database/models/Transaction_AccountNumbers");
const Transactions = require("../../../Database/models/Transactions");

const { sequelize } = require('../../../Database/dbConnection.js'); 

async function Invoice(transactionRequest, userId, transaction) {
  try {
    const SafeNumber = transactionRequest.safeNumber;
    if (!SafeNumber) {
      throw new Error("The employee does not have a safe number to make transactions.");
    }

    const TotalPrice = +transactionRequest.debit?.totalPrice;
    if (typeof TotalPrice !== "number") {
      throw new Error("Invalid or missing Debit object in the transaction request.");
    }

    if (!Array.isArray(transactionRequest.Credits)) {
      throw new Error("Credits must be an array.");
    }

    const ExistingTransaction = await Transactions.findOne({
      where: { ReceiptNumber: transactionRequest.receiptNumber },
      transaction,
    });
    
    if (ExistingTransaction) {
      throw new Error(
        `Receipt number ${transactionRequest.receiptNumber} is already paid.`
      );
    }
    
    const FilteredCredits = Object.values(
      transactionRequest.Credits.filter(
        (credit) => credit.accountNumberId && Number(credit.money) > 0
      ).reduce((creditsByAccount, credit) => {
        const accountNumberId = String(credit.accountNumberId);
        creditsByAccount[accountNumberId] = {
          accountNumberId,
          money:
            Number(creditsByAccount[accountNumberId]?.money || 0) +
            Number(credit.money || 0),
        };
        return creditsByAccount;
      }, {})
    ).map((credit) => ({
      ...credit,
      money: Number(credit.money).toFixed(2),
    }));

    const CreditTotalPrice = FilteredCredits.reduce(
      (sum, credit) => sum + parseFloat(credit.money || 0),
      0
    ).toFixed(2);

    const roundedTotalPrice = parseFloat(TotalPrice).toFixed(2);
    if (roundedTotalPrice !== CreditTotalPrice) {
      throw new Error(
        `The sum of credit does not equal the debit. debit=${roundedTotalPrice}, credits=${CreditTotalPrice}`
      );
    }

    const ConvertedSafeNumber = String(SafeNumber);

    const NewTransaction = await Transactions.create(
      {
        SafeNumber: ConvertedSafeNumber,
        ReceiptNumber: transactionRequest.receiptNumber,
        CreateByMembershipUser: userId,
        CreateAt: new Date(),
      },
      { transaction } 
    );

    const TransactionAccountNumbers = [];

    for (const Credit of FilteredCredits) {
      const AccountNumberId = parseInt(Credit.accountNumberId, 10);
      if (isNaN(AccountNumberId)) {
        throw new Error(`Invalid account number ID: ${Credit.accountNumberId}`);
      }

      const Account = await AccountNumbers.findOne(
        {
          where: { Id: AccountNumberId },
          transaction,
        }
      );
      if (!Account) {
        throw new Error(`Account number with ID ${AccountNumberId} does not exist.`);
      }

      const TransactionAccount = await Transaction_AccountNumbers.create(
        {
          TransactionId: NewTransaction.Id,
          AccountNumberId: AccountNumberId,
          Money: Credit.money,
        },
        { transaction } 
      );
      TransactionAccountNumbers.push(TransactionAccount);
    }

    const InvoiceData = {
      TransactionId: NewTransaction.Id,
      SafeNumber: NewTransaction.SafeNumber,
      ReceiptNumber: NewTransaction.ReceiptNumber,
      TotalDebit: parseFloat(TotalPrice).toFixed(2),
      TotalCredit: CreditTotalPrice,
      Remark: transactionRequest.remark || "",
      AccountItems: TransactionAccountNumbers.map((Account) => ({
        AccountId: Account.AccountNumberId,
        Money: parseFloat(Account.Money).toFixed(2),
      })),
      CreatedAt: new Date(),
    };

    return {
      status: "success",
      message: "Transaction created successfully with local invoice generated.",
      data: InvoiceData,
    };
  } catch (error) {
    throw error; 
  }
}



module.exports = Invoice;


