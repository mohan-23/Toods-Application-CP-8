const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at: http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDBServer();

const getStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const getPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const getStatusAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

//API 1 GetObjectThroughQueryParameters
app.get("/todos/", async (request, response) => {
  let resultData = "";
  let getTodoQuery = "";
  const { search_q = "", priority, status } = request.query;
  switch (true) {
    case getStatusProperty(request.query):
      getTodoQuery = `SELECT 
                              * 
                            FROM todo 
                            WHERE todo LIKE '%${search_q}%'
                            AND status = '${status}';`;
      break;
    case getPriorityProperty(request.query):
      getTodoQuery = `SELECT 
                              * 
                            FROM todo
                            WHERE todo LIKE '%${search_q}%'
                            AND priority = '${priority}';`;
      break;
    case getStatusAndPriorityProperty(request.query):
      getTodoQuery = `SELECT 
                              * 
                            FROM todo
                            WHERE todo LIKE '%${search_q}%'
                            AND status = '${status}'
                            AND priority = '${priority}';`;
      break;
    default:
      getTodoQuery = `SELECT
                              * 
                            FROM todo
                            WHERE todo LIKE '%${search_q}%'`;
  }
  resultData = await db.all(getTodoQuery);
  response.send(resultData);
});

//API 2 GetSingleObject
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo
                            WHERE id = ${todoId};`;
  const todoObject = await db.get(getTodoQuery);
  response.send(todoObject);
});

//API 3 POST PostObject
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const getPostQuery = `INSERT INTO 
                        todo (id, todo, priority, status)
                        VALUES (${id}, '${todo}', '${priority}', '${status}');`;
  const postTodoObject = await db.run(getPostQuery);
  response.send("Todo Successfully Added");
});

//API 4 PUT PutParticularColumn
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updateColumn = "";
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `SELECT * FROM todo
                             WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    status = previousTodo.status,
    priority = previousTodo.priority,
    todo = previousTodo.todo,
  } = request.body;

  const updateTodoQuery = `UPDATE todo
                        SET status = '${status}',
                            priority = '${priority}',
                            todo = '${todo}'
                        WHERE id = ${todoId};`;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//API 5 DeleteTodo
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo
                        WHERE id = ${todoId};`;
  const deleteTodoObject = await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
