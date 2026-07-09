document.getElementById('searchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('usernameInput').value.trim();
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('errorMessage');
    const dashboardResult = document.getElementById('dashboardResult');

    if (!username) return;

    loading.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    dashboardResult.classList.add('hidden');

    try {
        const response = await fetch(`/api/profile?username=${username}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Terjadi kesalahan saat mengambil data');
        }

        document.getElementById('userAvatar').src = data.user.avatar_url;
        document.getElementById('userName').textContent = data.user.name || data.user.login;
        document.getElementById('userLogin').textContent = `@${data.user.login}`;
        document.getElementById('userBio').textContent = data.user.bio || 'Tidak ada bio tertulis.';
        document.getElementById('userLink').href = data.user.html_url;

        document.getElementById('statRepos').textContent = data.user.public_repos;
        document.getElementById('statStars').textContent = data.total_stars;
        document.getElementById('statFollowers').textContent = data.user.followers;
        document.getElementById('statFollowing').textContent = data.user.following;

        const languageList = document.getElementById('languageList');
        languageList.innerHTML = '';
        
        const langEntries = Object.entries(data.top_languages || {});
        if (langEntries.length === 0) {
            languageList.innerHTML = `<p class="text-xs text-gray-400 italic">Tidak mendeteksi bahasa pemrograman dominan.</p>`;
        } else {
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

        let insightText = '';
        const totalRepos = data.user.public_repos;
        const stars = data.total_stars;
        const followers = data.user.followers;
        const following = data.user.following;
        
        if (stars > 100 || followers > 50) {
            insightText += `🔥 <strong class="text-white">Sangat Berpengaruh!</strong> Developer ini memiliki reputasi tingkat tinggi di komunitas dengan pencapaian <strong class="text-yellow-400">${stars} stars</strong>. `;
        } else if (stars > 20 || totalRepos > 30) {
            insightText += `🚀 <strong class="text-white">Sangat Produktif.</strong> Menunjukkan dedikasi dan konsistensi yang luar biasa dalam membangun aset kode publik. `;
        } else if (totalRepos > 5) {
            insightText += `✨ <strong class="text-white">Aktif Berkembang.</strong> Berada dalam fase solid dalam membangun portofolio dan mengeksplorasi ekosistem open-source. `;
        } else {
            insightText += `🌱 <strong class="text-white">Memulai Perjalanan.</strong> Akun ini masih baru atau lebih banyak beraktivitas di repository privat. `;
        }

        if (langEntries.length > 0) {
            const topLangName = langEntries[0][0];
            const topLangCount = langEntries[0][1];
            const totalLangCount = langEntries.reduce((sum, item) => sum + item[1], 0);
            const dominance = (topLangCount / totalLangCount) * 100;

            if (dominance > 75) {
                insightText += `Dilihat dari repositorinya, ia adalah seorang <strong class="text-red-400">Spesialis ${topLangName}</strong> sejati, dengan fokus keahlian yang sangat tajam pada teknologi tersebut. `;
            } else if (langEntries.length >= 3) {
                const top3 = langEntries.slice(0, 3).map(l => `<span class="text-red-400 font-bold">${l[0]}</span>`).join(', ');
                insightText += `Karakteristik kodenya menunjukkan ia seorang <strong class="text-white">Polyglot (Multi-bahasa)</strong> yang adaptif, dengan dominasi keahlian pada ${top3}. `;
            } else {
                insightText += `Fokus teknologi utamanya saat ini bertumpu pada <strong class="text-red-400">${topLangName}</strong>. `;
            }
        }

        if (followers > (following * 2) && followers > 10) {
            insightText += `Rasio pengikutnya menandakan karya-karyanya sering dijadikan referensi atau inspirasi oleh developer lain.`;
        } else if (following > 30 && following > followers) {
            insightText += `Ia juga memiliki rasa ingin tahu yang tinggi dan aktif memantau tren dari developer lain di GitHub.`;
        }

        document.getElementById('developerInsight').innerHTML = insightText;

        dashboardResult.classList.remove('hidden');

    } catch (err) {
        errorMessage.textContent = err.message || 'Gagal terhubung ke server.';
        errorMessage.classList.remove('hidden');
    } finally {
        loading.classList.add('hidden');
    }
});