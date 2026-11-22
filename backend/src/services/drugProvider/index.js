const { DrugInfoProvider } = require('./DrugInfoProvider');
const { AbdmNationalDrugAdapter } = require('./AbdmNationalDrugAdapter');
const { OpenFdaAdapter } = require('./OpenFdaAdapter');
const { CompositeDrugProvider } = require('./CompositeDrugProvider');

const defaultDrugProvider = new CompositeDrugProvider();

module.exports = {
  DrugInfoProvider,
  AbdmNationalDrugAdapter,
  OpenFdaAdapter,
  CompositeDrugProvider,
  defaultDrugProvider
};
