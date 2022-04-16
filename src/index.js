const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find((user) => user.username === username);

  if (!user) {
    return response.status(404).json({ error: "User not found" });
  }

  request.user = user;

  return next();
}

function checksExistsTodo(request, response, next) {
  const { id } = request.params;
  const { user } = request;

  let todoIndex = 0;

  const todo = user.todos.find((todo, key) => {
    if (todo.id === id) {
      todoIndex = key;
      return todo;
    }
  });

  if (!todo) {
    return response.status(404).json({ error: "Todo not found" });
  }

  request.todo = todo;
  request.todoIndex = todoIndex;

  return next();
}

/**
 * CREATE USER
 */
app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.some((user) => user.username === username);

  if (userAlreadyExists) {
    return response.status(400).json({ error: "User has already exists!" });
  }

  const id = uuidv4();

  const newUser = {
    name,
    username,
    id,
    todos: [],
  };

  users.push(newUser);

  return response.status(201).json(newUser);
});

/**
 * GET TODOS
 */
app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos).send();
});

/**
 * CREATE TODOS
 */
app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const { todos } = user;

  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  todos.push(newTodo);

  user.todos = todos;

  return response.status(201).json(newTodo);
});

/**
 * UPDATE TODOS
 */
app.put(
  "/todos/:id",
  checksExistsUserAccount,
  checksExistsTodo,
  (request, response) => {
    const { title, username } = request.body;
    const { user, todoIndex } = request;

    const updatedTodo = {
      ...user.todos[todoIndex],
      title,
      username,
    };

    user.todos[todoIndex] = updatedTodo;

    response.json(updatedTodo).send();
  }
);

/**
 * FINISH TODOS
 */
app.patch(
  "/todos/:id/done",
  checksExistsUserAccount,
  checksExistsTodo,
  (request, response) => {
    const { user, todoIndex } = request;

    const updatedTodo = {
      ...user.todos[todoIndex],
      done: true,
    };

    user.todos[todoIndex] = updatedTodo;

    response.json(updatedTodo).send();
  }
);

/**
 * DELETE TODOS
 */
app.delete(
  "/todos/:id",
  checksExistsUserAccount,
  checksExistsTodo,
  (request, response) => {
    const { user, todoIndex } = request;

    user.todos.splice(todoIndex, 1);

    return response.status(204).send();
  }
);

module.exports = app;
