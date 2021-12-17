const RolesSeeders = require('./roles');
const DashboardSeeder = require('./dashboard');
const Blocks = require('./block');
const seeders = {};

seeders.inializeProject = async (req, res) => {
  try {
    await RolesSeeders.inializeRoles();

    return res
      .status(200)
      .json({ message: 'seeders fired successfully', status: true });
  } catch (err) {
    return res.status(500).json({
      message: 'seeders error',
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

seeders.initializeDashboard = async (req, res) => {
  try {
    await DashboardSeeder.inializeDashboard();

    return res
      .status(200)
      .json({ message: 'seeders fired successfully', status: true });
  } catch (err) {
    return res.status(500).json({
      message: 'seeders error',
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

seeders.inializeBlocks = async (req, res) => {
  try {
    await Blocks.inializeBlock();
    return res
      .status(200)
      .json({ message: 'seeders fired successfully', status: true });
  } catch (err) {
    return res.status(500).json({
      message: 'seeders error',
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

module.exports = seeders;
