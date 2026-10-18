const { User } = require('./associations.js');

const Sequelize = require('sequelize').Sequelize;
const sequelize = require('../dbConnection.js').sequelize;
const Member = require('./members.js').Member;
const LookupCanceled = require('./lookup_Canceled.js').LookupCanceled;
const LookupStatus = require('./lookup_statues.js').LookupStatus;
const MemberRef = require('./member_ref.js').MemberRef;
const LookupUserRoles = require('./LookupUserRoles.js').LookupUserRoles;

const Memberships = sequelize.define('memberships', {
    id: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: Sequelize.fn('gen_random_uuid'),
        primaryKey: true,
    },
    start_date: {
        type: Sequelize.DATE,
    },
    end_date: {
        type: Sequelize.DATE,
    },
    // SeparateId:{
    //   type:sequelize.INTEGER
    // },
    status: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
    },
    remark: {
        type: Sequelize.TEXT,
    },
    member_code: {
        type: Sequelize.INTEGER,
    },
    member_order_date: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('CURRENT_TIMESTAMP'),
    },
    delay_penalty: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
    },
    previous_penalties: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
    },
    maintenance_fee: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
    },
    membership_card_fee: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
    },
    fellowship_fund_fee: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
    },
    transfer_separation_fee: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
    },
    renew_fee: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
    },
    renew_years: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
    },
    total_amount: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
    },
    value_added_tax: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
    },
    is_synced: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    safe_no: {
        type: Sequelize.INTEGER,
    },
    serial_no: {
        type: Sequelize.INTEGER,
        defaultValue: Sequelize.literal('nextval(\'memberships_serial_no_seq\'::regclass)'),
    },
    user_id: {
        type: Sequelize.TEXT,
    },
    swimming: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
    },
    first_time_fee: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
    },
    join_fee: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
    },
    form_no: {
        type: Sequelize.INTEGER,
    },
    canceled: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    secondary: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    related_membership: {
        type: Sequelize.TEXT,
    },
    installment: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
    },
    new_ref_fees: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
    },
    prev_years_fee: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
    },
    ref_member_id: {
        type: Sequelize.TEXT,
    },
    seperate_fees: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
    },
    member_order_time: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('CURRENT_TIMESTAMP'),
    },
    // InstallmentType:{
    //     type: Sequelize.TEXT,
    // }
}, {
    tableName: 'memberships',
    timestamps: false,
});

// Define foreign key associations
Memberships.belongsTo(LookupCanceled, { foreignKey: 'canceled' });
Memberships.belongsTo(Member, { foreignKey: 'member_code', targetKey: 'member_code', as: 'members' });
Member.hasMany(Memberships, { foreignKey: 'member_code', sourceKey: 'member_code', as: 'memberships' });
Memberships.belongsTo(MemberRef, { foreignKey: 'ref_member_id', targetKey: 'id', as: 'membersRefs' });
MemberRef.hasMany(Memberships, { foreignKey: 'ref_member_id', sourceKey: 'id', as: 'membersRefs' });
Memberships.belongsTo(MemberRef, { foreignKey: 'member_code', targetKey: 'member_code', as: 'membersRef' });
MemberRef.hasMany(Memberships, { foreignKey: 'member_code', sourceKey: 'member_code', as: 'membersRef' });
Memberships.belongsTo(LookupStatus, { foreignKey: 'status' });
Memberships.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {Memberships};
