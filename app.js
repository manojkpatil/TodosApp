const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

app = express();
const databasePath = path.join(__dirname, "todoApplication.db");
app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertToCamelCase = (dbResponse) => {
  return {
    id: dbResponse.id,
    todo: dbResponse.todo,
    priority: dbResponse.priority,
    status: dbResponse.status,
    category: dbResponse.category,
    dueDate: dbResponse.due_date,
  };
};
const hasPriorityAndStatusAndCateoryProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined &&
    requestQuery.status !== undefined &&
    requestQuery.category !== undefined
  );
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityAndCategory = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasStatusAndCategory = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", category, priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusAndCateoryProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}'
        AND category = '${category}';`;
      break;
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;

    case hasPriorityAndCategory(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}'
        AND category = '${category}';`;
      break;
    case hasStatusAndCategory(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND category = '${category}';`;
      break;

    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}'`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;

    case hasCategoryProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}';`;
      break;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }

  data = await database.all(getTodosQuery);
  response.send(data.map((dbResponse) => convertToCamelCase(dbResponse)));
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getListById = `
    SELECT *
    FROM todo 
    WHERE id = ${todoId};`;
  dbResponse = await database.get(getListById);
  console.log(dbResponse);
  response.send(convertToCamelCase(dbResponse));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(date);
  const getMethodQuery = `
  SELECT *
  FROM todo
  WHERE due_date = '${date}';`;
  const dbResponse = await database.all(getMethodQuery);
  response.send(dbResponse.map((data) => convertToCamelCase(data)));
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  console.log(id);
  console.log(category);
  const postMethodQuery = `
  INSERT INTO todo
  (id, todo, priority, status, category, due_date)
  VALUES 
  (${id}, '${todo}', '${priority}', '${status}', '${category}', '${dueDate}');`;
  await database.run(postMethodQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;
  let updateMethodQuery = null;
  switch (true) {
    case status !== undefined:
      if (status === "DONE" || status === "TO DO" || status === "IN PROGRESS") {
        updateMethodQuery = `
        UPDATE todo 
        SET status = '${status}'
        WHERE id = ${todoId};`;
        await database.run(updateMethodQuery);
        response.status(200);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case priority !== undefined:
      if (priority === "HIGH" || "MEDIUM" || "LOW") {
        updateMethodQuery = `
            UPDATE todo 
            SET priority = '${priority}'
            WHERE id = ${todoId};`;
        await database.run(updateMethodQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case todo !== undefined:
      updateMethodQuery = `
        UPDATE todo 
        SET todo = '${todo}'
        WHERE id = ${todoId};`;
      await database.run(updateMethodQuery);
      response.send("Todo Updated");
      break;
    case category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateMethodQuery = `
            UPDATE todo 
            SET category = '${category}'
            WHERE id = ${todoId};`;
        await database.run(updateMethodQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case dueDate !== undefined:
      updateMethodQuery = `
        UPDATE todo 
        SET due_date = '${dueDate}'
        WHERE id = ${todoId};`;
      await database.run(updateMethodQuery);
      response.send("Due Date Updated");
    default:
      response.send("nothing updated");
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteMethodQuery = `
    DELETE FROM todo 
    WHERE id = ${todoId};`;
  await database.run(deleteMethodQuery);
  response.send("Todo Deleted");
});

module.exports = app;
