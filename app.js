document.getElementById('searchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('usernameInput').value.trim();
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('errorMessage');
    const dashboardResult = document.getElementById('dashboardResult');

    if (!username) return;

    // Reset Tampilan
    loading.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    dashboardResult.classList.add('hidden');

    try {
        // Tembak endpoint API Golang Serverless kita
        const response = await fetch(`/api/profile?username=${username}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Terjadi kesalahan saat mengambil data');
        }

        // 1. Isi Data Profil Utama
        document.getElementById('userAvatar').src = data.user.avatar_url;
        document.getElementById('userName').textContent = data.user.name || data.user.login;
        document.getElementById('userLogin').textContent = `@${data.user.login}`;
        document.getElementById('userBio').textContent = data.user.bio || 'Tidak ada bio tertulis.';
        document.getElementById('userLink').href = data.user.html_url;

        // 2. Isi Data Statistik
        document.getElementById('statRepos').textContent = data.user.public_repos;
        document.getElementById('statStars').textContent = data.total_stars;
        document.getElementById('statFollowers').textContent = data.user.followers;
        document.getElementById('statFollowing').textContent = data.user.following;

        // 3. Render Top Languages dengan Progress Bar minimalis
        const languageList = document.getElementById('languageList');
        languageList.innerHTML = '';
        
        const langEntries = Object.entries(data.top_languages || {});
        if (langEntries.length === 0) {
            languageList.innerHTML = `<p class="text-xs text-gray-400 italic">Tidak mendeteksi bahasa pemrograman dominan.</p>`;
        } else {
            // Urutkan bahasa terbanyak
            langEntries.sort((a, b) => b[1] - a[1]);
            const totalLangCount = langEntries.reduce((sum, item) => sum + item[1], 0);

            langEntries.slice(0, 5).forEach(([lang, count]) => {
                const percentage = Math.round((count / totalLangCount) * 100);
                const itemHtml = `
                    <div>
                        <div class="flex justify-between items-center text-xs font-semibold mb-1">
                            <span class="text-gray-700">${lang}</span>
                            <span class="text-nitenRed">${percentage}%</span>
                        </div>
                        <div class="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div class="bg-nitenRed h-full rounded-full" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
                languageList.insertAdjacentHTML('beforeend', itemHtml);
            });
        }

        // 4. Render 5 Recent Repositories
        const repoList = document.getElementById('repoList');
        repoList.innerHTML = '';
        
        if (!data.recent_repos || data.recent_repos.length === 0) {
            repoList.innerHTML = `<p class="text-xs text-gray-400 italic">Tidak ada repository publik.</p>`;
        } else {
            data.recent_repos.forEach(repo => {
                const updatedDate = new Date(repo.updated_at).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'short', year: 'numeric'
                });
                const repoHtml = `
                    <div class="p-3 bg-gray-50 border border-gray-100 rounded-xl flex justify-between items-center hover:border-nitenRed/30 hover:bg-red-50/10 transition group">
                        <div>
                            <h4 class="text-xs font-bold text-nitenDark group-hover:text-nitenRed transition">${repo.name}</h4>
                            <span class="text-[10px] text-gray-400">Diperbarui: ${updatedDate}</span>
                        </div>
                        <div class="flex items-center gap-3 text-xs text-gray-500">
                            ${repo.language ? `<span class="bg-white border border-gray-200 px-2 py-0.5 rounded-md text-[10px] font-medium text-gray-600">${repo.language}</span>` : ''}
                            <div class="flex items-center gap-1">
                                <span>⭐</span> <span>${repo.stargazers_count}</span>
                            </div>
                        </div>
                    </div>
                `;
                repoList.insertAdjacentHTML('beforeend', repoHtml);
            });
        }

        // 5. Racik Kesimpulan Cerdas (Developer Insight)
        const topLang = langEntries.length > 0 ? langEntries[0][0] : null;
        let insightText = '';
        
        if (data.user.public_repos > 50 && data.total_stars > 20) {
            insightText = `🔥 Akun luar biasa! Developer ini sangat produktif dengan total ${data.user.public_repos} repo publik dan kontribusinya diakui komunitas lewat pencapaian ${data.total_stars} bintang.`;
        } else if (data.user.public_repos > 10) {
            insightText = `🚀 Developer yang aktif berkreasi. Konsisten membangun aset kode publik secara mandiri maupun kolaboratif.`;
        } else {
            insightText = `✨ Akun dalam tahap pertumbuhan. Siap menjelajahi ekosistem open-source lebih jauh lagi.`;
        }

        if (topLang) {
            insightText += ` Fokus keahlian utamanya saat ini terlihat kuat pada teknologi berbasis <span class="text-red-300 font-bold">${topLang}</span>.`;
        }

        document.getElementById('developerInsight').innerHTML = insightText;

        // Munculkan Hasil Akhir Dashboard
        dashboardResult.classList.remove('hidden');

    } catch (err) {
        errorMessage.textContent = err.message || 'Gagal terhubung ke server.';
        errorMessage.classList.remove('hidden');
    } finally {
        loading.classList.add('hidden');
    }
});