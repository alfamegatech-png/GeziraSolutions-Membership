const memberRefRouter = require("../Modules/Member Ref/memberRef.routes.js").memberRefRouter;
const membershipRouter = require("../Modules/MemberShipsDetails/membership.routes.js").membershipRouter;
const memberTypeRouter = require("../Modules/Member_type/Member_type.routes.js").memberTypeRouter;
const memberRouter = require("../Modules/MembersDetails/member.routes.js").memberRouter;
const PricingRuleRouter = require("../Modules/Pricing Rule/PricingRule.routes.js").PricingRuleRouter;
const SignInRouter = require("../Modules/login/login.routes.js").SignInRouter;
const globalError = require("../middleware/globalErrorMiddleware.js").globalError;
const { SeasonalMembershipPricesRouter } = require("../Modules/SeasonalMembershipPrices/SeasonalMembershipPrices.routes.js");
const { AppError } = require("./AppError.js");

function bootstrap(app) {
    app.use("/api", memberRouter);
    app.use("/api", memberRefRouter);
    app.use("/api", SignInRouter);
    app.use("/api", membershipRouter);
    app.use("/api", memberTypeRouter);
    app.use("/api", PricingRuleRouter);
    app.use("/api", SeasonalMembershipPricesRouter);
    app.get("/", (req, res) => {
        res.status(200).json({
            message: "SuperAdmin backend is running",
            frontendLogin: "http://localhost:3000/login",
            apiLogin: "POST http://localhost:5000/api/login"
        });
    });
    app.get("/api", (req, res) => {
        res.status(200).json({
            message: "SuperAdmin API is running",
            login: "POST /api/login"
        });
    });


    // app.use("/api", lookupTransRouter);

    app.all('*', (req, res, next) => {
        next(new AppError('Not Found EndPoint', 404));
    });
    app.use(globalError);
}

module.exports = bootstrap;
