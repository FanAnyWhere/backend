const DashboardModel = require('../modules/admin/dashboard/dashboardModel');
const Utils = require('../helper/utils');
const Dashboard = {};

Dashboard.inializeDashboard = async () => {
  try {
    await DashboardModel.insertMany([
      { name: 'Banner', slugtext: 'Banner', isActive: true, rank: 1 },
      { name: 'Top Nft', slugtext: 'Top Nft', isActive: true, rank: 2 },
      {
        name: 'Hall Of Frame',
        slugText: 'Hall Of Frame',
        isActive: true,
        rank: 3,
      },
      { name: 'Collections', slugText: 'Collections', isActive: true, rank: 4 },
      { name: 'Info', slugText: 'Info', isActive: true, rank: 5 },
      {
        name: 'Profile Info',
        slugText: 'profile-info',
        isActive: true,
        rank: 6,
      },
    ]);
  } catch (err) {
    Utils.echoLog('error in adding new roles');
  }
};

module.exports = Dashboard;
