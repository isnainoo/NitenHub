/**
 * NitenHub - GitHub Profile Analyzer
 * Core Logic & UI Rendering
 */

// 1. Cache DOM Elements (Agar performa lebih cepat, tidak mencari elemen berulang kali)
const DOM = {
    form: document.getElementById('searchForm'),
    input: document.getElementById('usernameInput'),
    loading: document.getElementById('loading'),
    error: document.getElementById('errorMessage'),
    dashboard: document.getElementById('dashboardResult'),
    
    // Profile Elements
    avatar: document.getElementById('userAvatar'),
    name: document.getElementById('userName'),
    login: document.getElementById('userLogin'),
    bio: document.getElementById('userBio'),
    link: document.getElementById('userLink'),
    
    // Stats Elements
    statRepos: document.getElementById('statRepos'),
    statStars: document.getElementById('statStars'),
    statFollowers: document.getElementById('statFollowers'),
    statFollowing: document.getElementById('statFollowing'),
    
    // List & Insight Elements
    languageList: document.getElementById('languageList'),
    repoList: document.getElementById('repoList'),
    insight: document.getElementById('developerInsight')
};

// 2. Main Event Listener
DOM.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = DOM.input.value.trim();
    if (!username) return;

    updateUIState('loading');

    try {
        const response = await fetch(`/api/profile?username=${username}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Terjadi kesalahan saat mengambil data.');
        }

        renderDashboard(data);
        updateUIState('success');
    } catch (err) {
        showError(err.message);
        updateUIState('error');
    }
});

// 3. UI State Management
function updateUIState(state) {
    DOM.loading.classList.add('hidden');
    DOM.error.classList.add('hidden');
    
    if (state === 'loading') {
        DOM.loading.classList.remove('hidden');
        DOM.dashboard.classList.add('hidden');
        DOM.dashboard.classList.remove('animate-fade-in-up');
        DOM.dashboard.classList.add('opacity-0');
    } else if (state === 'success') {
        DOM.dashboard.classList.remove('hidden');
        // Trigger reflow untuk animasi
        void DOM.dashboard.offsetWidth; 
        DOM.dashboard.classList.remove('opacity-0');
        DOM.dashboard.classList.add('animate-fade-in-up');
    }
}

function showError(message) {
    DOM.error.textContent = message;
    DOM.error.classList.remove('hidden');
}

// 4. Core Renderer (Mendistribusikan data ke masing-masing komponen)
function renderDashboard({ user, top_languages, total_stars, recent_repos }) {
    renderProfile(user);
    renderStats(user, total_stars);
    renderLanguages(top_languages);
    renderRepos(recent_repos);
    renderInsight(user, total_stars, top_languages);
}

// 5. Component Renderers
function renderProfile(user) {
    DOM.avatar.src = user?.avatar_url ?? '';
    DOM.name.textContent = user?.name ?? user?.login;
    DOM.login.textContent = `@${user?.login}`;
    DOM.bio.textContent = user?.bio ?? 'Tidak ada bio tertulis.';
    DOM.link.href = user?.html_url ?? '#';
}

function renderStats(user, totalStars) {
    DOM.statRepos.textContent = user?.public_repos ?? 0;
    DOM.statStars.textContent = totalStars ?? 0;
    DOM.statFollowers.textContent = user?.followers ?? 0;
    DOM.statFollowing.textContent = user?.following ?? 0;
}

function renderLanguages(languages = {}) {
    DOM.languageList.innerHTML = '';
    const langEntries = Object.entries(languages).sort((a, b) => b[1] - a[1]);

    if (langEntries.length === 0) {
        DOM.languageList.innerHTML = `<p class="text-xs text-gray-400 italic">Tidak mendeteksi bahasa pemrograman dominan.</p>`;
        return;
    }

    const totalLangCount = langEntries.reduce((sum, item) => sum + item[1], 0);

    const htmlString = langEntries.slice(0, 5).map(([lang, count]) => {
        const percentage = Math.round((count / totalLangCount) * 100);
        return `
            <div class="group">
                <div class="flex justify-between items-center text-xs font-semibold mb-1.5">
                    <span class="text-gray-700 group-hover:text-nitenDark transition-colors">${lang}</span>
                    <span class="text-nitenRed font-bold">${percentage}%</span>
                </div>
                <div class="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden shadow-inner">
                    <div class="bg-gradient-to-r from-nitenRedHover to-nitenRed h-full rounded-full transition-all duration-1000 ease-out" style="width: 0%;" data-width="${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');

    DOM.languageList.innerHTML = htmlString;

    // Animasi progress bar meluncur
    setTimeout(() => {
        DOM.languageList.querySelectorAll('[data-width]').forEach(el => {
            el.style.width = el.getAttribute('data-width');
        });
    }, 100);
}

function renderRepos(repos = []) {
    DOM.repoList.innerHTML = '';
    
    if (repos.length === 0) {
        DOM.repoList.innerHTML = `<p class="text-xs text-gray-400 italic col-span-2">Tidak ada repository publik.</p>`;
        return;
    }

    const htmlString = repos.map(repo => {
        const updatedDate = new Date(repo.updated_at).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
        
        return `
            <a href="https://github.com/${repo.full_name || ''}" target="_blank" class="block p-4 bg-white border border-gray-100 rounded-2xl flex flex-col justify-between hover:border-nitenRed/30 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
                <div class="mb-3">
                    <h4 class="text-sm font-extrabold text-nitenDark group-hover:text-nitenRed transition-colors truncate" title="${repo.name}">${repo.name}</h4>
                    <span class="text-[10px] text-gray-400 font-medium">Update: ${updatedDate}</span>
                </div>
                <div class="flex items-center justify-between text-xs text-gray-500">
                    ${repo.language 
                        ? `<span class="bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-600">${repo.language}</span>` 
                        : '<span></span>'
                    }
                    <div class="flex items-center gap-1.5 font-bold text-nitenDark">
                        <svg class="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                        <span>${repo.stargazers_count}</span>
                    </div>
                </div>
            </a>
        `;
    }).join('');

    DOM.repoList.innerHTML = htmlString;
}

function renderInsight(user, totalStars, languages = {}) {
    let text = '';
    const { public_repos: totalRepos, followers, following } = user;
    const langEntries = Object.entries(languages).sort((a, b) => b[1] - a[1]);
    
    // 1. Analisis Reputasi
    if (totalStars > 100 || followers > 50) {
        text += `🔥 <strong class="text-white">Sangat Berpengaruh!</strong> Developer ini memiliki reputasi elit di komunitas open-source dengan pencapaian <strong class="text-yellow-400">${totalStars} stars</strong>. `;
    } else if (totalStars > 20 || totalRepos > 30) {
        text += `🚀 <strong class="text-white">Sangat Produktif.</strong> Menunjukkan dedikasi dan konsistensi yang stabil dalam merancang aset kode publik. `;
    } else if (totalRepos > 5) {
        text += `✨ <strong class="text-white">Aktif Berkembang.</strong> Berada dalam fase eksplorasi yang solid untuk memperkuat portofolio teknikalnya. `;
    } else {
        text += `🌱 <strong class="text-white">Memulai Perjalanan.</strong> Akun ini masih tergolong baru atau lebih sering mengelola *private repository*. `;
    }

    // 2. Analisis Spesialisasi
    if (langEntries.length > 0) {
        const topLangName = langEntries[0][0];
        const topLangCount = langEntries[0][1];
        const totalLangCount = langEntries.reduce((sum, item) => sum + item[1], 0);
        const dominance = (topLangCount / totalLangCount) * 100;

        if (dominance > 75) {
            text += `Berkat dominasi logikanya di atas 75%, ia bisa dikategorikan sebagai <strong class="text-red-400">Spesialis ${topLangName}</strong> yang fokus mendalami satu ekosistem. `;
        } else if (langEntries.length >= 3) {
            const top3 = langEntries.slice(0, 3).map(l => `<span class="text-red-400 font-bold">${l[0]}</span>`).join(', ');
            text += `Struktur repositorinya menunjukkan ia seorang <strong class="text-white">Polyglot</strong> yang adaptif, menguasai beberapa tumpukan teknologi sekaligus dengan kekuatan utama di ${top3}. `;
        } else {
            text += `Fokus teknologinya saat ini paling dominan menggunakan <strong class="text-red-400">${topLangName}</strong>. `;
        }
    }

    // 3. Analisis Jaringan
    if (followers > (following * 2) && followers > 10) {
        text += `Rasio pengikutnya menandakan bahwa proyek atau kodenya sering dijadikan bahan rujukan oleh developer lain.`;
    } else if (following > 30 && following > followers) {
        text += `Ia juga memiliki rasa ingin tahu yang tinggi, aktif mengamati tren dan arsitektur dari *engineer* lain di platform ini.`;
    }

    DOM.insight.innerHTML = text;
}