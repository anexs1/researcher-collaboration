// backend/models/UserBookmark.js
import { DataTypes } from "sequelize";

const UserBookmarkModel = (sequelize) => {
  const UserBookmark = sequelize.define(
    "UserBookmark",
    {
      // Foreign Key for the User
      userId: {
        type: DataTypes.INTEGER.UNSIGNED, // <<< MATCHES users.id type: int(10) unsigned
        allowNull: false,
        primaryKey: true, // Part of the composite primary key
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      // Foreign Key for the Publication
      publicationId: {
        type: DataTypes.INTEGER, // <<< MATCHES publications.id type: int(11) (signed)
        allowNull: false,
        primaryKey: true, // Part of the composite primary key
        references: {
          model: "publications",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      // createdAt is automatically added by timestamps: true below
      // If your DB table explicitly has a createdAt, you can define it:
      // createdAt: {
      //   type: DataTypes.DATE, // Or DataTypes.TIMESTAMP
      //   allowNull: false,
      //   defaultValue: DataTypes.NOW
      // }
    },
    {
      // Sequelize options
      tableName: "user_bookmarks", // Explicitly set table name
      timestamps: true, // Manage createdAt/updatedAt fields automatically. Set to false if your DB doesn't have/need them for this table.
      updatedAt: false, // Often join tables only need createdAt
      // No default 'id' field needed as we have a composite primary key (userId, publicationId)
      // Indexes are typically defined on the foreign keys themselves or handled by the DB schema/migration
    }
  );

  // Since this is a join table, it usually doesn't need its own 'associate' method
  // The associations are defined in the User and Publication models using belongsToMany
  // UserBookmark.associate = (models) => {
  //   // Example if needed:
  //   UserBookmark.belongsTo(models.User, { foreignKey: 'userId' });
  //   UserBookmark.belongsTo(models.Publication, { foreignKey: 'publicationId' });
  // };

  return UserBookmark;
};

export default UserBookmarkModel;
