const App_URL = "https://jsonplaceholder.typicode.com/todos";

let todoState = [];
const STORAGE_KEY = "todos-app";
const initializeForm = () => {
  const form = document.getElementById("todoForm");
  const todoInput = document.getElementById("todoInput");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (todoInput.length < 3) {
      alert("Todo must be at least 3 characters long");
      return;
    }

    await createNewTodoIte(todoInput.value);
    todoInput.value = "";
  });
};

const deleteTodo = async (todo) => {
  const todoElement = document.getElementById(`todo-${todo.id}`);
  todoElement.classList.add("deleting");

  try {
    const response = await fetch(`${App_URL}/${todo.id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete todo");
    todoState = todoState.filter((t) => t.id !== todo.id);
    todoElement.style.opacity = "0";

    setTimeout(() => {
      todoElement.remove();
      if (todoState.length === 0) {
        document.getElementById("todoList").innerHTML =
          "<p>No todos found.</p>";
      }
    }, 300);
    saveToLocalStorage();
    updateTodoCount();
  } catch (error) {
    showErrorMessage("Failed to delete todo. Please try again.");
    todoElement.classList.remove("deleting");
  }
};

function updateTodoElement(todo) {
  const todoElement = document.getElementById(`todo-${todo.id}`);
  if (todoElement) {
    const newTodoElement = createTodoItem(todo);

    todoElement.replaceWith(newTodoElement);
  }
}

const handleTodoAction = (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const action = button.dataset.action;
  const todoElement = button.closest(".todo-item");
  const todoId = parseInt(todoElement.id.replace("todo-", ""));
  const todo = todoState.find((t) => t.id === todoId);

  if (!todo) return;

  if (action === "toggle") {
    toggleTodoStatus(todo);
  } else if (action === "delete") {
    deleteTodo(todo);
  }
};

const toggleTodoStatus = async (todo) => {
  const todoElement = document.getElementById(`todo-${todo.id}`);
  const toggleButton = todoElement.querySelector(".btn-toggle");
  toggleButton.disabled = true;

  try {
    const response = await fetch(`${App_URL}/${todo.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        completed: !todo.completed,
      }),
    });

    if (!response.ok) throw new Error("Failed to update todo");

    todo.completed = !todo.completed;
    updateTodoElement(todo);
    saveToLocalStorage();
    updateTodoCount();

    filterTodo(document.querySelector(".filter-btn.active").dataset.filter);
    // filterTodos();
  } catch (error) {
    console.log(error);
    showErrorMessage("Failed to update todo. Please try again.");
    toggleButton.disabled = false;
  }
};

const createNewTodoIte = async (title) => {
  const submitButton = document.getElementById("submitButton");
  submitButton.disabled = true;
  submitButton.classList.add("loading");
  const data = {
    userId: 1,
    id: Date.now(),
    title: title,
    completed: false,
  };

  try {
    const response = await fetch(App_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create todo", response.status);
    }
    todoState.unshift(data);

    saveToLocalStorage();
    const todoItem = createTodoItem(data);
    const todoList = document.getElementById("todoList");
    todoItem.style.opacity = "0";

    todoList.insertBefore(todoItem, todoList.firstChild);
    requestAnimationFrame(() => {
      todoItem.style.opacity = "1";
    });
    updateTodoCount();
  } catch (error) {
    showError("Failed to create todo. Please try again.");
  } finally {
    submitButton.disabled = false;
    submitButton.classList.remove("loading");
  }
};
const saveToLocalStorage = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todoState));
};

const loadFromLocalStorage = () => {
  const toDos = localStorage.getItem(STORAGE_KEY);
  return toDos ? JSON.parse(toDos) : null;
};

const showLoadingBox = () => {
  const loadingBox = document.getElementById("loadingMessage");
  loadingBox.style.display = "block";
};

const hideLoadingBox = () => {
  const loadingBox = document.getElementById("loadingMessage");
  loadingBox.style.display = "none";
};

const showErrorMessage = (message) => {
  const messageBox = document.getElementById("errorMessage");
  messageBox.style.display = "block";
  messageBox.textContent = message;
};

const fetchTodos = async () => {
  if (loadFromLocalStorage() == null) {
    showLoadingBox();
    try {
      const response = await fetch(App_URL);

      if (!response.ok) {
        hideLoadingBox();
        throw new Error("Http Error:", response.status);
      }
      todoState = await response.json();
      saveToLocalStorage();
      hideLoadingBox();
    } catch (error) {
      hideLoadingBox();
      showErrorMessage("Failed to load todos. Please refresh the page.");
    } finally {
      hideLoadingBox();
    }
  } else {
    todoState = loadFromLocalStorage();
  }
};

const createTodoItem = (todo) => {
  const todoItem = document.createElement("div");
  todoItem.className = `todo-item ${todo.completed ? "completed" : ""}`;
  todoItem.id = `todo-${todo.id}`;

  todoItem.innerHTML = `<span class="todo-text">${todo.title}</span> 
  <div class="todo-actions">
      <button class="btn btn-toggle" data-action="toggle">
          ${todo.completed ? "Undo" : "Complete"}
      
      </button>
      <button class="btn btn-delete" data-action="delete">
          Delete
      </button>
   </div>`;

  return todoItem;
};

const renderTodoList = (todos) => {
  const todoList = document.getElementById("todoList");
  todoList.innerHTML = "";
  if (todoState.length === 0) {
    todoList.innerHTML = "<p>No todos found.</p>";
    return;
  }

  todos.forEach((todo) => {
    const todoItem = createTodoItem(todo);
    todoList.appendChild(todoItem);
  });
};

const updateTodoCount = () => {
  const todoCount = document.getElementById("todoCount");
  const count = todoState.filter((todo) => !todo.completed).length;
  todoCount.textContent = `${count} item${count !== 1 ? "s" : ""} left`;
};

const filterTodo = (filter) => {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });

  const fliteredTodo = todoState.filter((todo) => {
    if (filter == "active") return !todo.completed;
    if (filter == "completed") return todo.completed;
    return true;
  });
  renderTodoList(fliteredTodo);
};

const clearCompleted = () => {
  todoState
    .filter((todo) => todo.completed)
    .forEach(async (todo) => {
      await deleteTodo(todo);
    });
};
const initializeApp = async () => {
  document
    .getElementById("todoList")
    .addEventListener("click", handleTodoAction);
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => filterTodo(btn.dataset.filter));
  });
  document
    .getElementById("clearCompleted")
    .addEventListener("click", clearCompleted);
  initializeForm();
  await fetchTodos();

  renderTodoList(todoState);
  updateTodoCount();
};

document.addEventListener("DOMContentLoaded", initializeApp);
