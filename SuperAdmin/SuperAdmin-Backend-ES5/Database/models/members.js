const DataTypes = require('sequelize').DataTypes;
const Sequelize = require('sequelize').Sequelize;
const sequelize = require('../../Database/dbConnection.js').sequelize;
const MemberRef = require('./member_ref.js').MemberRef;

const Member = sequelize.define('Member', {
  id: {
    type: DataTypes.UUID,
    defaultValue: sequelize.literal('gen_random_uuid()'),
    primaryKey: true,
  },
  member_code: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  name: DataTypes.STRING,
  national_id: DataTypes.STRING,
  image_name: DataTypes.STRING,
  birth_date: DataTypes.DATE,
  address: DataTypes.STRING,
  job: DataTypes.INTEGER,
  job_address: DataTypes.STRING,
  job_tel: DataTypes.STRING,
  marital_status: DataTypes.INTEGER,
  nationality: DataTypes.INTEGER,
  religion: DataTypes.INTEGER,
  sex: DataTypes.INTEGER,
  tel: DataTypes.STRING,
  remark: DataTypes.STRING,
  member_type: DataTypes.INTEGER,
  section: DataTypes.INTEGER,
  city: DataTypes.INTEGER,
  area: DataTypes.INTEGER,
  qual: DataTypes.INTEGER,
  trans: DataTypes.INTEGER,
  id_1: DataTypes.INTEGER,
  birth_place: DataTypes.STRING,
  user_id: DataTypes.STRING,
  join_date: DataTypes.DATE,
  suspended: {
    type: DataTypes.STRING,
    defaultValue: '-',
  },
  suspended_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  

}, {
  tableName: 'members',
  timestamps: false, // Set to true if you want to include timestamps (createdAt, updatedAt)
});

module.exports = { Member };
