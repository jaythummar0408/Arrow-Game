// Central export file for all models
module.exports = {
  State: require("./state.model"),
  District: require("./district.model"),
  Market: require("./market.model"),
  Commodity: require("./commodity.model"),
  Variety: require("./variety.model"),
  Grade: require("./grade.model"),
  MarketPrice: require("./marketPrice.model"),
  User: require("./user.model"),
  PriceAlert: require("./priceAlert.model"),
  KhataTransaction: require("./khataTransaction.model"),
  TractorCustomer: require("./tractorCustomer.model"),
  TractorWork: require("./tractorWork.model"),
  News: require("./news.model"),
  Notification: require("./notification.model"),
};
