   <script>
    document.addEventListener('DOMContentLoaded', () => {
        const originalContent = document.getElementById('original-content');
        const prakaranWrapper = document.getElementById('prakaran-wrapper');
        const prakaranToc = document.getElementById('prakaran-toc');
        const alphaToc = document.getElementById('alpha-toc');
        const alphaBar = alphaToc.querySelector('.alpha-bar');
        const alphaListContent = alphaToc.querySelector('.alpha-list-content');
        const prakaranTitleEl = document.getElementById('prakaran-title');
        const tooltip = document.getElementById('tooltip');
        const tooltipContentDiv = document.getElementById('tooltip-content');
        const tooltipCloseBtn = document.getElementById('tooltip-close-btn');
        const sidebar = document.getElementById('sidebar');
        const menuBtn = document.getElementById('menu-btn');
        const overlay = document.getElementById('overlay');
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        const fontIncBtn = document.getElementById('font-inc-btn');
        const fontDecBtn = document.getElementById('font-dec-btn');
        const searchBtn = document.getElementById('search-btn');
        const searchOverlay = document.getElementById('search-overlay');
        const searchInput = document.getElementById('search-input');
        const searchCloseBtn = document.getElementById('search-close-btn');
        const searchResults = document.getElementById('search-results');

        let prakaranData = [];
        let allVachans = [];
        let searchIndex = [];
        let currentPrakaranIndex = -1;
        let baseFontSize = 1.05;
        const VACHAN_PAGE_SIZE = 30;

        function initializeApp() {
            parseContent();
            buildPrakaranPages();
            buildPrakaranToc();
            buildAlphaToc();
            setupEventListeners();
        }

        function parseContent() {
            let currentPrakaran = null;
            let paragraphIdCounter = 0;
            Array.from(originalContent.children).forEach(p => {
                const text = p.innerText.trim();
                const contentId = `content-${paragraphIdCounter++}`;
                p.id = contentId; 

                if (p.classList.contains('p5') && text) {
                    if (currentPrakaran) prakaranData.push(currentPrakaran);
                    currentPrakaran = { title: text, id: `prakaran-${prakaranData.length}`, content: [], vachans: [] };
                }
                if (currentPrakaran) {
                    const localVachanNumber = currentPrakaran.vachans.length + 1;
                    const contentItem = { tag: p.tagName, className: p.className, html: p.innerHTML, text: text, type: 'default', id: contentId };
                    
                    if(text) {
                        searchIndex.push({ 
                            text: text, 
                            prakaranIndex: prakaranData.length, 
                            elementId: contentId, 
                            prakaranTitle: currentPrakaran.title,
                            isVachan: text.startsWith('वचन'),
                            vachanNumber: text.startsWith('वचन') ? localVachanNumber : null
                        });
                    }

                    if (text.startsWith('वचन')) {
                        contentItem.type = 'vachan';
                        const vachanId = `${currentPrakaran.id}-vachan-${localVachanNumber -1}`;
                        contentItem.id = vachanId;
                        const vachanInfo = { id: vachanId, text: text.replace(/^वचन\s*[:\-–—]*/, '').trim(), prakaranIndex: prakaranData.length, prakaranTitle: currentPrakaran.title, number: localVachanNumber };
                        currentPrakaran.vachans.push(vachanInfo);
                        allVachans.push(vachanInfo);
                    }
                    currentPrakaran.content.push(contentItem);
                }
            });
            if (currentPrakaran) prakaranData.push(currentPrakaran);
        }
        
        function buildPrakaranPages() {
            prakaranWrapper.innerHTML = '';
            prakaranData.forEach((prakaran, index) => {
                const prakaranDiv = document.createElement('div');
                prakaranDiv.id = prakaran.id;
                prakaranDiv.className = 'prakaran-content';
                prakaran.content.forEach(item => {
                    const p = document.createElement(item.tag);
                    p.className = item.className;
                    if (item.type === 'vachan') {
                        const vachan = prakaran.vachans.find(v => v.id === item.id);
                        if(vachan) p.innerHTML = item.html.replace(/^(<span[^>]*>)?वचन\s*[:\-–—]*/, `$1वचन ${vachan.number} :-`);
                        else p.innerHTML = item.html;
                    } else {
                        p.innerHTML = item.html;
                    }
                    p.id = item.id;
                    prakaranDiv.appendChild(p);
                });
                const navDiv = document.createElement('div');
                navDiv.className = 'prakaran-nav';
                const prevBtn = document.createElement('button');
                prevBtn.innerHTML = '&larr; मागील प्रकरण';
                prevBtn.disabled = index === 0;
                prevBtn.onclick = () => showPrakaran(index - 1);
                const nextBtn = document.createElement('button');
                nextBtn.innerHTML = 'पुढील प्रकरण &rarr;';
                nextBtn.disabled = index === prakaranData.length - 1;
                nextBtn.onclick = () => showPrakaran(index + 1);
                navDiv.appendChild(prevBtn);
                navDiv.appendChild(nextBtn);
                prakaranDiv.appendChild(navDiv);
                prakaranWrapper.appendChild(prakaranDiv);
            });
            const welcomePage = document.createElement('div');
            welcomePage.className = 'prakaran-content active';
            welcomePage.id = 'welcome-page';
            welcomePage.innerHTML = `
                <h1 class="welcome-title">स्थळ पोथी</h1>
                <h2 class="welcome-subtitle">श्री देवदत्त आश्रम जाधववाडी</h2>
                <p style="text-align: center; font-size: 1.2rem; margin-top: 2rem;">डावीकडील मेनू (☰) मधून प्रकरण किंवा वचन निवडा.</p>
            `;
            prakaranWrapper.prepend(welcomePage);
        }
        
        function showTikaPopup(event, vachanId) {
            event.preventDefault();
            event.stopPropagation();
            
            const vachanEl = document.getElementById(vachanId);
            if (!vachanEl) return;

            let tikaText = '', lapikaText = '';
            let nextEl = vachanEl.nextElementSibling;
            
            while (nextEl && !nextEl.classList.contains('p9') && !nextEl.classList.contains('p5')) {
                if (nextEl.innerText.trim().startsWith('टीका :-')) tikaText += nextEl.innerText.replace('टीका :-', '').trim() + '<br><br>';
                if (nextEl.innerText.trim().startsWith('लापिका :-')) lapikaText += nextEl.innerText.replace('लापिका :-', '').trim() + '<br><br>';
                nextEl = nextEl.nextElementSibling;
            }

            let tooltipHTML = '';
            if (lapikaText) tooltipHTML += `<h4>लापिका</h4><p class="tooltip-lapika">${lapikaText}</p>`;
            if (tikaText) tooltipHTML += `<h4>टीका</h4><p class="tooltip-tika">${tikaText}</p>`;

            if (tooltipHTML) {
                tooltipContentDiv.innerHTML = tooltipHTML;
                
                const linkRect = event.currentTarget.getBoundingClientRect();
                tooltip.style.left = `${linkRect.right + 15}px`;
                tooltip.style.top = `${linkRect.top}px`;
                tooltip.style.transform = `scale(0.95)`;
                
                tooltip.classList.add('visible');
                 void tooltip.offsetWidth;
                tooltip.style.transform = `scale(1)`;

                const tooltipRect = tooltip.getBoundingClientRect();
                 if (tooltipRect.right > window.innerWidth - 10) {
                    tooltip.style.left = `${linkRect.left - tooltipRect.width - 15}px`;
                }
                if (tooltipRect.bottom > window.innerHeight - 10) {
                    tooltip.style.top = `${window.innerHeight - tooltipRect.height - 10}px`;
                }
                 if (tooltipRect.left < 10) {
                    tooltip.style.left = '10px';
                }
                 if (tooltipRect.top < 10) {
                    tooltip.style.top = '10px';
                }
            }
        }
        
        function setupVachanLinkInteractions(linkElement) {
            let lastTap = 0;
            const vachanId = linkElement.dataset.vachanId;
            const vachan = allVachans.find(v => v.id === vachanId);

            linkElement.addEventListener('click', (e) => {
                e.preventDefault();
                const now = new Date().getTime();
                const timeSince = now - lastTap;

                if (timeSince < 300 && timeSince > 0) {
                    showTikaPopup(e, vachanId);
                    lastTap = 0;
                } else {
                    if (vachan) {
                       showPrakaran(vachan.prakaranIndex, vachan.id);
                    }
                }
                lastTap = new Date().getTime();
            });

            linkElement.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showTikaPopup(e, vachanId);
            });
        }

        function renderVachanPage(prakaranTocContainer, prakaranIndex, page) {
            const vachanListDiv = prakaranTocContainer.querySelector('.vachan-list');
            const paginationDiv = prakaranTocContainer.querySelector('.vachan-pagination');
            const prakaran = prakaranData[prakaranIndex];
            const vachans = prakaran.vachans;
            const totalPages = Math.ceil(vachans.length / VACHAN_PAGE_SIZE);

            vachanListDiv.innerHTML = '';
            
            const start = page * VACHAN_PAGE_SIZE;
            const end = start + VACHAN_PAGE_SIZE;
            const pageVachans = vachans.slice(start, end);

            pageVachans.forEach(vachan => {
                const a = document.createElement('a');
                a.href = `#${vachan.id}`;
                a.dataset.vachanId = vachan.id;
                a.textContent = `${vachan.number}. ${vachan.text.substring(0, 35)}...`;
                setupVachanLinkInteractions(a);
                vachanListDiv.appendChild(a);
            });
            
            paginationDiv.innerHTML = '';
            if (totalPages > 1) {
                const prevBtn = document.createElement('button');
                prevBtn.textContent = '<<';
                prevBtn.disabled = page === 0;
                prevBtn.onclick = () => renderVachanPage(prakaranTocContainer, prakaranIndex, page - 1);
                paginationDiv.appendChild(prevBtn);

                paginationDiv.append(` ${page + 1} / ${totalPages} `);

                const nextBtn = document.createElement('button');
                nextBtn.textContent = '>>';
                nextBtn.disabled = page === totalPages - 1;
                nextBtn.onclick = () => renderVachanPage(prakaranTocContainer, prakaranIndex, page + 1);
                paginationDiv.appendChild(nextBtn);
            }
        }

        function buildPrakaranToc() {
            prakaranToc.innerHTML = ''; 
            prakaranData.forEach((prakaran, index) => {
                const container = document.createElement('div');
                container.className = 'prakaran-toc-container';
                
                const h3 = document.createElement('h3');
                h3.className = 'prakaran-heading';
                h3.textContent = `${prakaran.title} (${prakaran.vachans.length})`;
                container.appendChild(h3);

                const vachanListDiv = document.createElement('div');
                vachanListDiv.className = 'vachan-list';
                container.appendChild(vachanListDiv);

                h3.onclick = () => {
                    if (prakaran.vachans.length > 0) {
                        container.classList.toggle('expanded');
                        if (container.classList.contains('expanded') && vachanListDiv.children.length === 0 && prakaran.vachans.length > VACHAN_PAGE_SIZE) {
                            renderVachanPage(container, index, 0);
                        }
                    } else {
                        showPrakaran(index);
                    }
                };
                
                if (prakaran.vachans.length <= VACHAN_PAGE_SIZE) { 
                    prakaran.vachans.forEach(vachan => {
                        const a = document.createElement('a');
                        a.href = `#${vachan.id}`;
                        a.dataset.vachanId = vachan.id;
                        a.textContent = `${vachan.number}. ${vachan.text.substring(0, 35)}...`;
                        setupVachanLinkInteractions(a);
                        vachanListDiv.appendChild(a);
                    });
                }
                 if (prakaran.vachans.length > VACHAN_PAGE_SIZE) {
                    const paginationDiv = document.createElement('div');
                    paginationDiv.className = 'vachan-pagination';
                    container.appendChild(paginationDiv);
                }

                prakaranToc.appendChild(container);
            });
        }
        
        function buildAlphaToc() {
             const marathiLetters = ['अ','आ','इ','ई','उ','ऊ','ए','ऐ','ओ','औ','क','ख','ग','घ','च','छ','ज','झ','ट','ठ','ड','ढ','ण','त','थ','द','ध','न','प','फ','ब','भ','म','य','र','ल','व','श','ष','स','ह'];
             const groupedVachans = marathiLetters.reduce((acc, letter) => ({ ...acc, [letter]: [] }), {});
             allVachans.forEach(vachan => { const first = vachan.text.charAt(0); if(groupedVachans[first]) groupedVachans[first].push(vachan); });
             
             alphaBar.innerHTML = '';
             alphaListContent.innerHTML = '';

             marathiLetters.forEach(letter => {
                if (groupedVachans[letter].length) {
                    const btn = document.createElement('button');
                    btn.textContent = letter;
                    btn.onclick = () => {
                        const target = document.getElementById(`alpha-group-${letter}`);
                        if(target) target.scrollIntoView({ behavior: 'smooth' });
                    };
                    alphaBar.appendChild(btn);

                    const groupDiv = document.createElement('div');
                    groupDiv.id = `alpha-group-${letter}`;
                    const h3 = document.createElement('h3');
                    h3.textContent = letter;
                    groupDiv.appendChild(h3);
                    
                    groupedVachans[letter].forEach(vachan => {
                        const a = document.createElement('a');
                        a.href = `#${vachan.id}`;
                        a.dataset.vachanId = vachan.id;
                        a.innerHTML = `${vachan.number}. ${vachan.text.substring(0, 35)}... <span class="prakaran-ref">(${vachan.prakaranTitle})</span>`;
                        setupVachanLinkInteractions(a);
                        groupDiv.appendChild(a);
                    });
                    alphaListContent.appendChild(groupDiv);
                }
             });
        }
        
        function setupEventListeners() {
            menuBtn.onclick = () => { sidebar.classList.add('is-open'); overlay.classList.add('is-visible'); };
            overlay.onclick = () => { sidebar.classList.remove('is-open'); overlay.classList.remove('is-visible'); };
            
            const tocPrakaranBtn = document.getElementById('toc-prakaran-btn');
            const tocAlphaBtn = document.getElementById('toc-alpha-btn');
            
            tocPrakaranBtn.onclick = () => {
                document.getElementById('prakaran-toc').classList.add('active-toc');
                document.getElementById('alpha-toc').classList.remove('active-toc');
                tocPrakaranBtn.classList.add('active');
                tocAlphaBtn.classList.remove('active');
            };
            tocAlphaBtn.onclick = () => {
                document.getElementById('prakaran-toc').classList.remove('active-toc');
                document.getElementById('alpha-toc').classList.add('active-toc');
                tocPrakaranBtn.classList.remove('active');
                tocAlphaBtn.classList.add('active');
            };

            themeToggleBtn.onclick = () => {
                document.body.classList.toggle('light-theme');
                document.body.classList.toggle('dark-theme');
                themeToggleBtn.textContent = document.body.classList.contains('dark-theme') ? '🌙' : '☀️';
            };
            fontIncBtn.onclick = () => {
                baseFontSize = Math.min(1.5, baseFontSize + 0.05);
                document.querySelector('.content-panel').style.fontSize = `${baseFontSize}rem`;
            };
            fontDecBtn.onclick = () => {
                baseFontSize = Math.max(0.8, baseFontSize - 0.05);
                document.querySelector('.content-panel').style.fontSize = `${baseFontSize}rem`;
            };
            
            tooltipCloseBtn.onclick = (e) => {
                e.stopPropagation();
                tooltip.classList.remove('visible');
            };

            let lastTooltipTap = 0;
            tooltip.addEventListener('click', (e) => {
                if(e.target === tooltip || e.target === tooltipContentDiv) {
                    const now = Date.now();
                    if (now - lastTooltipTap < 300) { 
                        tooltip.classList.remove('visible');
                    }
                    lastTooltipTap = now;
                }
            });
            
            searchBtn.onclick = () => { searchOverlay.style.display = 'flex'; searchInput.focus(); };
            searchCloseBtn.onclick = () => { searchOverlay.style.display = 'none'; searchInput.value = ''; searchResults.innerHTML = ''; };
            searchOverlay.onclick = (e) => { if(e.target === searchOverlay) searchCloseBtn.click(); };
            searchInput.oninput = performSearch;
        }

        function performSearch() {
            const query = searchInput.value.trim();
            if (query.length < 1) {
                searchResults.innerHTML = '';
                return;
            }

            const regex = new RegExp(query, 'gi');
            const results = searchIndex.filter(item => item.text.toLowerCase().includes(query.toLowerCase())).slice(0, 50);

            searchResults.innerHTML = results.map(result => {
                const snippet = getSnippet(result.text, query);
                const highlightedSnippet = snippet.replace(regex, `<span class="highlight">$&</span>`);
                const vachanPrefix = result.isVachan ? `<span class="result-vachan-num">वचन ${result.vachanNumber}: </span>` : '';
                return `
                    <a href="#" class="search-result-item" data-prakaran-index="${result.prakaranIndex}" data-element-id="${result.elementId}">
                        <p>${vachanPrefix}${highlightedSnippet}</p>
                        <span class="result-prakaran">${result.prakaranTitle}</span>
                    </a>
                `;
            }).join('');
            
            searchResults.querySelectorAll('.search-result-item').forEach(item => {
                item.onclick = (e) => {
                    e.preventDefault();
                    const prakaranIndex = parseInt(item.dataset.prakaranIndex);
                    const elementId = item.dataset.elementId;
                    showPrakaran(prakaranIndex, elementId);
                    searchOverlay.style.display = 'none';
                    searchInput.value = '';
                    searchResults.innerHTML = '';
                };
            });
        }
        
        function getSnippet(text, query) {
            const index = text.toLowerCase().indexOf(query.toLowerCase());
            if (index === -1) return text.substring(0, 150) + '...';
            const start = Math.max(0, index - 40);
            const end = Math.min(text.length, index + query.length + 40);
            let snippet = text.substring(start, end);
            if (start > 0) snippet = '...' + snippet;
            if (end < text.length) snippet = snippet + '...';
            return snippet;
        }

        function showPrakaran(index, elementId = null) {
            if (index < 0 || index >= prakaranData.length) {
                 document.querySelectorAll('.prakaran-content').forEach(p => p.classList.remove('active'));
                 document.getElementById('welcome-page').classList.add('active');
                 prakaranTitleEl.textContent = "स्थळ पोथी";
                 return;
            };
            currentPrakaranIndex = index;

            document.querySelectorAll('.prakaran-content').forEach(p => p.classList.remove('active'));
            const prakaranToShow = document.getElementById(prakaranData[index].id);
            if (prakaranToShow) {
                prakaranToShow.classList.add('active');
                prakaranTitleEl.textContent = prakaranData[index].title;
                const scroller = document.querySelector('.content-panel');
                if (elementId) {
                    const targetEl = document.getElementById(elementId);
                    if (targetEl) {
                        setTimeout(() => {
                            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            targetEl.classList.remove('flash-highlight');
                            void targetEl.offsetWidth; 
                            targetEl.classList.add('flash-highlight');
                        }, 100);
                    }
                } else {
                    scroller.scrollTop = 0;
                }
            }
            sidebar.classList.remove('is-open');
            overlay.classList.remove('is-visible');
        }

        initializeApp();
    });
