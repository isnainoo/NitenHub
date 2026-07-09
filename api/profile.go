package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

type GitHubUser struct {
	Login       string `json:"login"`
	Name        string `json:"name"`
	AvatarURL   string `json:"avatar_url"`
	HtmlURL     string `json:"html_url"`
	Bio         string `json:"bio"`
	PublicRepos int    `json:"public_repos"`
	Followers   int    `json:"followers"`
	Following   int    `json:"following"`
}

type GitHubRepo struct {
	Name            string    `json:"name"`
	Language        string    `json:"language"`
	StargazersCount int       `json:"stargazers_count"`
	ForksCount      int       `json:"forks_count"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type NitenResponse struct {
	User         GitHubUser     `json:"user"`
	TopLanguages map[string]int `json:"top_languages"`
	TotalStars   int            `json:"total_stars"`
	RecentRepos  []GitHubRepo   `json:"recent_repos"`
}

func Handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET")

	username := r.URL.Query().Get("username")
	if username == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Parameter username wajib diisi"})
		return
	}

	token := os.Getenv("GITHUB_TOKEN")

	userUrl := fmt.Sprintf("https://api.github.com/users/%s", username)
	userData, err := fetchFromGitHub(userUrl, token)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Gagal mengambil data profil"})
		return
	}

	var githubUser GitHubUser
	if err := json.Unmarshal(userData, &githubUser); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Gagal memproses data profil"})
		return
	}

	if githubUser.Login == "" {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "User GitHub tidak ditemukan"})
		return
	}

	reposUrl := fmt.Sprintf("https://api.github.com/users/%s/repos?per_page=100&sort=updated", username)
	reposData, err := fetchFromGitHub(reposUrl, token)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Gagal mengambil data repository"})
		return
	}

	var repos []GitHubRepo
	if err := json.Unmarshal(reposData, &repos); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Gagal memproses data repository"})
		return
	}

	totalStars := 0
	languageMap := make(map[string]int)
	var recentRepos []GitHubRepo

	for i, repo := range repos {
		totalStars += repo.StargazersCount
		
		if repo.Language != "" {
			languageMap[repo.Language]++
		}

		if i < 5 {
			recentRepos = append(recentRepos, repo)
		}
	}

	response := NitenResponse{
		User:         githubUser,
		TopLanguages: languageMap,
		TotalStars:   totalStars,
		RecentRepos:  recentRepos,
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func fetchFromGitHub(url string, token string) ([]byte, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}

	if token != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", token))
	}
	req.Header.Set("Accept", "application/vnd.github+json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub API mengembalikan status %d", resp.StatusCode)
	}

	var body []byte
	buf := make([]byte, 1024)
	for {
		n, err := resp.Body.Read(buf)
		if n > 0 {
			body = append(body, buf[:n]...)
		}
		if err != nil {
			break
		}
	}

	return body, nil
}