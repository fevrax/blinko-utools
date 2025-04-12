// 定义全局变量
let theme;
let userTokens = {};
let defaultServerUrl = "https://blinko.kl.do"

// 更新主题按钮的图标
function updateThemeButton() {
    if (theme === 'dark') {
        $('#theme-icon, #theme-icon-loader').text('🌙')
    } else {
        $('#theme-icon, #theme-icon-loader').text('☀️')
    }
}

// 手动切换主题
function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light'
    $('html').attr('data-theme', theme)
    updateThemeButton()
}

// 监听系统主题变化
function setupThemeListener() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        theme = e.matches ? 'dark' : 'light'
        $('html').attr('data-theme', theme)
        updateThemeButton()
    })
}

// 重置设置
function resetSettings() {
    // 清空服务器URL
    utools.dbStorage.removeItem('server-url')

    // 重置界面选项
    $('#server-select').val('default')
    $('#custom-server-input').val('')
    $('#server-error').hide()
    toggleServerOptions()

    // 显示提示
    utools.showNotification('服务器设置已重置')
}

// 更新界面状态
function updateUIState(showSetting = true) {
    if (showSetting) {
        $('#loading-container').hide()
        $('#setting-container').show()
        // 重置取消按钮状态
        $('#cancel-loading-btn').hide()
        clearTimeout(window.cancelBtnTimer)
    } else {
        $('#setting-container').hide()
        $('#loading-container').css('display', 'flex')
        $('#cancel-loading-btn').hide()

        // 两秒后显示取消按钮
        window.cancelBtnTimer = setTimeout(() => {
            $('#cancel-loading-btn').show()
        }, 2000)
    }
    // 确保主题显示一致
    updateThemeButton()
}

// 使用jQuery绑定事件
$(document).ready(function() {
    // 初始化主题
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    theme = isDark ? 'dark' : 'light'
    $('html').attr('data-theme', theme)
    updateThemeButton()

    // 设置主题变化监听
    setupThemeListener()

    // 绑定取消加载按钮事件
    $('#cancel-loading-btn').on('click', () => {
        updateUIState(true)
        clearTimeout(window.cancelBtnTimer)
    })

    // 绑定主题切换按钮事件
    $('#theme-toggle-btn').on('click', toggleTheme);
    // 绑定重置按钮点击事件
    $('#reset-btn').on('click', resetSettings);
    // 绑定服务器选择下拉框变化事件
    $('#server-select').on('change', toggleServerOptions);
    // 绑定确认按钮点击事件
    $('#confirm-btn').on('click', saveConfig);
    // 绑定uTools登录按钮点击事件
    $('#utools-login-btn').on('click', handleUToolsLogin);

    // 如果之前有自定义服务器设置，恢复选项状态
    const savedUrl = utools.dbStorage.getItem('server-url')
    if (savedUrl && savedUrl !== defaultServerUrl) {
        $('#server-select').val('custom')
        $('#custom-server-input').val(savedUrl)
        toggleServerOptions()
    } else {
        // 默认显示默认服务器选项
        $('#default-server').addClass('show')
    }
});

utools.onPluginEnter(({ code, type, payload }) => {
    console.log('用户进入插件应用', code, type, payload)

    if (payload === 'blinkoSttting' || payload === '闪念设置') {
        updateUIState(true)
        return
    }

    // 检查是否配置过服务器
    const serverUrl = utools.dbStorage.getItem('server-url')
    console.log('当前服务器地址:', serverUrl)

    // 如果没有配置或配置无效，显示设置页面
    if (!serverUrl) {
        updateUIState(true)
    } else {
        // 使用配置的服务器地址
        launchBrowser(serverUrl)
    }
})

function toggleServerOptions() {
    const select = $('#server-select').val()
    if (select === 'custom') {
        $('#custom-server').addClass('show')
        $('#default-server').removeClass('show')
    } else {
        $('#custom-server').removeClass('show')
        $('#default-server').addClass('show')
        $('#server-error').hide()
    }
}

function isValidUrl(url) {
    try {
        new URL(url)
        return true
    } catch (e) {
        return false
    }
}

function saveConfig() {
    const select = $('#server-select').val()
    let serverUrl = defaultServerUrl // 默认服务器

    if (select === 'custom') {
        const customUrl = $('#custom-server-input').val().trim()
        if (customUrl && isValidUrl(customUrl)) {
            serverUrl = customUrl
            $('#server-error').hide()
        } else {
            $('#server-error').show()
            return
        }
    }

    // 保存配置到 dbStorage
    utools.dbStorage.setItem('server-url', serverUrl)

    // 启动浏览器
    launchBrowser(serverUrl)
}

function launchBrowser(url) {
    // 显示加载状态
    updateUIState(false)
    utools.clearUBrowserCache()

    // 创建浏览器实例
    const browser = utools.ubrowser.goto(url)
        .devTools('bottom')
        .evaluate((tokens) => {
            // 检测页面是否成功加载
            window.addEventListener('error', (e) => {
                // 通知主进程页面加载错误
                utools.showNotification('连接服务器失败，请检查网络或服务器地址')
            })
            function setCookie(name, value, options = {}) {
                const {
                    expires,
                    path = '/',
                    secure = true,
                    sameSite = 'Lax',
                } = options;
                let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
                cookieString += `; Path=${path}`;
                if (secure) {
                    cookieString += `; Secure`;
                }
                cookieString += `; SameSite=${sameSite}`;
                if (expires) {
                    const expiresDate = expires instanceof Date ? expires : new Date(expires);
                    cookieString += `; Expires=${expiresDate.toUTCString()}`;
                }

                document.cookie = cookieString;
                console.log(`Set cookie: ${cookieString}`);
            }

            // 使用传入的 tokens 参数
            if (tokens && tokens.csrfToken && tokens.sessionToken) {
                setCookie('__Host-next-auth.csrf-token', tokens.csrfToken);
                setCookie('__Secure-next-auth.session-token', tokens.sessionToken);
                console.log('已设置登录令牌');

            }
            return true;
        }, userTokens)

    // 运行浏览器
    browser.run({ width: 1200, height: 800 })
        .then(() => {
            console.log('浏览器已成功启动')
            // 显示设置页
            updateUIState(true)
        })
        .catch((err) => {
            console.error('浏览器启动失败', err)
            updateUIState(true)
            clearTimeout(window.cancelBtnTimer)
            utools.showNotification('启动失败，请检查网络连接或服务器地址')
        })
}

// uTools一键登录功能
async function handleUToolsLogin() {
    try {
        // 显示加载状态
        updateUIState(false)
        $('.loading-text').text('正在登录...')

        // 获取用户临时令牌
        const { token } = await utools.fetchUserServerTemporaryToken()

        // 获取用户信息
        const userInfo = await getUserInfo(token)
        if (!userInfo) {
            throw new Error('获取用户信息失败')
        }

        // 调用新的登录接口
        const loginResult = await loginWithOpenId(userInfo.open_id, userInfo.nickname)
        if (!loginResult || !loginResult.success) {
            throw new Error(loginResult?.message || '登录失败')
        }

        // 保存登录状态
        userTokens = {
            csrfToken: loginResult.csrfToken,
            sessionToken: loginResult.sessionToken
        }

        utools.dbStorage.setItem('server-url', defaultServerUrl)
        // 启动浏览器
        launchBrowser(defaultServerUrl)

    } catch (error) {
        console.error('登录失败', error)
        updateUIState(true)
        clearTimeout(window.cancelBtnTimer)
        utools.showNotification('登录失败: ' + error.message)
    }
}

// 使用token获取用户信息
async function getUserInfo(accessToken) {
    try {
        console.log('获取到的accessToken:', accessToken)

        // 使用本地开发的接口获取用户信息
        const response = await fetch(`http://raw.kl.do:18084/utools/blinko/baseinfo?access_token=${accessToken}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`)
        }

        const data = await response.json()

        // 检查返回的数据是否包含resource字段
        if (data.resource) {
            return data.resource
        } else {
            throw new Error('返回数据格式不正确')
        }
    } catch (error) {
        console.error('获取用户信息失败', error)
        return null
    }
}

// 使用openId直接登录
async function loginWithOpenId(openId,nickname) {
    try {
        const response = await fetch('http://localhost:8080/utools/blinko/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                openId: openId,
                nickname: nickname
            })
        })

        if (!response.ok) {
            throw new Error(`登录API请求失败: ${response.status}`)
        }

        return await response.json()
    } catch (error) {
        console.error('登录请求失败', error)
        return null
    }
}
