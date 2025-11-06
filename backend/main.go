package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"sync"
)

type Task struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"` // "todo", "progress", "done"
}

var (
	tasks      []Task
	nextID     = 1
	tasksMutex sync.Mutex
)

func main() {
	// Adiciona algumas tarefas de exemplo
	tasks = append(tasks, Task{
		ID:          nextID,
		Title:       "Tarefa de exemplo",
		Description: "Esta é uma tarefa inicial",
		Status:      "todo",
	})
	nextID++

	http.HandleFunc("/tasks", enableCORS(handleTasks))
	http.HandleFunc("/tasks/", enableCORS(handleTaskByID))

	log.Println("Servidor rodando na porta 8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func handleTasks(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		getTasks(w, r)
	case "POST":
		createTask(w, r)
	default:
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
	}
}

func handleTaskByID(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "PUT":
		updateTask(w, r)
	case "DELETE":
		deleteTask(w, r)
	default:
		http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
	}
}

func getTasks(w http.ResponseWriter, r *http.Request) {
	tasksMutex.Lock()
	defer tasksMutex.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tasks)
}

func createTask(w http.ResponseWriter, r *http.Request) {
	var task Task
	if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
		http.Error(w, "Erro ao processar requisição", http.StatusBadRequest)
		return
	}

	// Validação básica
	if task.Title == "" {
		http.Error(w, "Título é obrigatório", http.StatusBadRequest)
		return
	}

	if task.Status == "" {
		task.Status = "todo"
	}

	// Valida o status
	validStatus := map[string]bool{"todo": true, "progress": true, "done": true}
	if !validStatus[task.Status] {
		http.Error(w, "Status inválido", http.StatusBadRequest)
		return
	}

	tasksMutex.Lock()
	task.ID = nextID
	nextID++
	tasks = append(tasks, task)
	tasksMutex.Unlock()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(task)
}

func updateTask(w http.ResponseWriter, r *http.Request) {
	// Extrai o ID da URL
	idStr := r.URL.Path[len("/tasks/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	var updatedTask Task
	if err := json.NewDecoder(r.Body).Decode(&updatedTask); err != nil {
		http.Error(w, "Erro ao processar requisição", http.StatusBadRequest)
		return
	}

	// Validações
	if updatedTask.Title == "" {
		http.Error(w, "Título é obrigatório", http.StatusBadRequest)
		return
	}

	validStatus := map[string]bool{"todo": true, "progress": true, "done": true}
	if !validStatus[updatedTask.Status] {
		http.Error(w, "Status inválido", http.StatusBadRequest)
		return
	}

	tasksMutex.Lock()
	defer tasksMutex.Unlock()

	// Busca a tarefa
	found := false
	for i, task := range tasks {
		if task.ID == id {
			tasks[i].Title = updatedTask.Title
			tasks[i].Description = updatedTask.Description
			tasks[i].Status = updatedTask.Status
			found = true

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(tasks[i])
			break
		}
	}

	if !found {
		http.Error(w, "Tarefa não encontrada", http.StatusNotFound)
	}
}

func deleteTask(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Path[len("/tasks/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	tasksMutex.Lock()
	defer tasksMutex.Unlock()

	found := false
	for i, task := range tasks {
		if task.ID == id {
			tasks = append(tasks[:i], tasks[i+1:]...)
			found = true
			w.WriteHeader(http.StatusNoContent)
			break
		}
	}

	if !found {
		http.Error(w, "Tarefa não encontrada", http.StatusNotFound)
	}
}
