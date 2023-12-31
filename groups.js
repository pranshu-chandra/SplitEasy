const express = require('express');
const router = express.Router();
const db = require('./db');
const crypto = require('crypto');

// POST - CreateGroupTableWithUsers
router.post('/CreateGroupWithUsers', async (req, res) => {
  try {
    const { userUUIDList } = req.body;

    // Validate that the userUUIDList is an array
    if (!Array.isArray(userUUIDList)) {
      return res.status(400).json({ error: 'Invalid input. Please provide an array of userUUIDs.' });
    }

    // Generate a UUID for the table name
    const tableUUID = crypto.randomUUID();
    const tableName = `group_${tableUUID.replace(/-/g, '')}`;

    // Generate column names and the query with double quotes
    const columnDefinitions = [`"UserUUID" VARCHAR(255)`].concat(userUUIDList.map(uuid => `"${uuid}" INT DEFAULT 0`));
    const createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefinitions.join(', ')})`;

    console.log(createTableQuery);

    // Execute the query to create the table
    await db.queryGroups(createTableQuery);

    // Generate rows with user_uuid and default values (0) using a for loop
    const insertRowsQueries = [];
    for (const uuid of userUUIDList) {
      const insertRowQuery = `
        INSERT INTO ${tableName} ("UserUUID")
        VALUES
        ('${uuid}');
      `;
      insertRowsQueries.push(insertRowQuery);
    }

    console.log(insertRowsQueries);

    // Execute the queries to insert rows
    for (const query of insertRowsQueries) {
      await db.queryGroups(query);
    }

    res.status(201).json({ success: true, message: 'Table with users created successfully.', tableName });
  } catch (err) {
    console.error(err);

    // Check if headers have been sent before sending the response
    if (!res.headersSent) {
      res.status(500).json({ error: 'An error occurred while creating the table with users.' });
    }
  }
});

// GET - GetUsersFromGroupTable
router.get('/GetUsersFromGroup/:tableName', async (req, res) => {
    try {
      const { tableName } = req.params;
  
      // Fetch UserUUIDs from the specified table
      const getUserUUIDsQuery = `SELECT "UserUUID" FROM ${tableName}`;
      const result = await db.queryGroups(getUserUUIDsQuery);
      
      // Extract UserUUIDs from the result
      const userUUIDs = result.rows.map(row => row.UserUUID);
  
      res.status(200).json({ success: true, userUUIDs });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred while fetching UserUUIDs from the table.' });
    }
  });
  
  // GET - GetAllDataFromTable
router.get('/GetAllData/:tableName', async (req, res) => {
    try {
      const { tableName } = req.params;
  
      // Fetch all users from the specified table
      const getUsersQuery = `SELECT * FROM ${tableName}`;
      const users = await db.queryGroups(getUsersQuery);
  
      res.status(200).json({ success: true, users });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred while fetching users from the table.' });
    }
  });

  // PUT - AddUsersToTable
router.patch('/AddUsersToGroup/:groupName', async (req, res) => {
    try {
      const { groupName } = req.params;
      const { userUUIDList } = req.body;
  
      // Validate that the userUUIDList is an array
      if (!Array.isArray(userUUIDList)) {
        return res.status(400).json({ error: 'Invalid input. Please provide an array of userUUIDs.' });
      }
  
      // Generate column definitions for the new columns
      const newColumnDefinitions = userUUIDList.map(uuid => `"${uuid}" INT DEFAULT 0`);
  
      // Add new columns to the table
      const alterTableQuery = `
        ALTER TABLE ${groupName}
        ADD COLUMN ${newColumnDefinitions.join(', ')}
      `;
      await db.queryGroups(alterTableQuery);
  
      // Generate rows with user_uuid and default values (0) using a for loop
    const insertRowsQueries = [];
    for (const uuid of userUUIDList) {
      const insertRowQuery = `
        INSERT INTO ${groupName} ("UserUUID")
        VALUES
        ('${uuid}');
      `;
      insertRowsQueries.push(insertRowQuery);
    }

    console.log(insertRowsQueries);

    // Execute the queries to insert rows
    for (const query of insertRowsQueries) {
      await db.queryGroups(query);
    }
  
      res.status(200).json({ success: true, message: 'Users added to the table successfully.', groupName });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred while adding users to the table.' });
    }
  });

  // DELETE - DeleteUsersFromGroup
router.delete('/DeleteUsersFromGroup/:tableName', async (req, res) => {
    try {
      const { tableName } = req.params;
      const { userUUIDList } = req.body;
  
      // Validate that the userUUIDList is an array
      if (!Array.isArray(userUUIDList)) {
        return res.status(400).json({ error: 'Invalid input. Please provide an array of userUUIDs.' });
      }
  
      // Generate column names for deletion
      const columnsToDelete = userUUIDList.map(uuid => `"${uuid}"`);
  
      // Delete columns from the table
      const dropColumnsQuery = `
        ALTER TABLE ${tableName}
        DROP COLUMN IF EXISTS ${columnsToDelete.join(', ')}
      `;
      await db.queryGroups(dropColumnsQuery);
  
      // Delete rows where UserUUID in userUUIDList
      const deleteRowsQuery = `
        DELETE FROM ${tableName}
        WHERE "UserUUID" IN (${userUUIDList.map(uuid => `'${uuid}'`).join(', ')})
      `;
      await db.queryGroups(deleteRowsQuery);
  
      res.status(200).json({ success: true, message: 'Users deleted from the table successfully.', tableName });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred while deleting users from the table.' });
    }
  });

module.exports = router;
