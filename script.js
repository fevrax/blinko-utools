// 定义全局变量
let theme;

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

// 更新界面状态
function updateUIState(showSetting = true) {
    if (showSetting) {
        $('#loading-container').hide()
        $('#setting-container').show()
    } else {
        $('#setting-container').hide()
        $('#loading-container').css('display', 'flex')
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
    
    // 绑定主题切换按钮事件
    $('#theme-toggle-btn, #theme-toggle-btn-loader').on('click', toggleTheme);
    // 绑定服务器选择下拉框变化事件
    $('#server-select').on('change', toggleCustomServer);
    // 绑定确认按钮点击事件
    $('#confirm-btn').on('click', saveConfig);
    
    // 如果之前有自定义服务器设置，恢复选项状态
    const savedUrl = utools.dbStorage.getItem('server-url')
    if (savedUrl && savedUrl !== 'https://blinko.kl.do') {
        $('#server-select').val('custom')
        $('#custom-server-input').val(savedUrl)
        toggleCustomServer()
    }
});

utools.onPluginEnter(({ code, type, payload }) => {
    console.log('用户进入插件应用', code, type, payload)

    if (payload === 'blinko-setting') {
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

function toggleCustomServer() {
    const select = $('#server-select').val()
    if (select === 'custom') {
        $('#custom-server').addClass('show')
    } else {
        $('#custom-server').removeClass('show')
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
    let serverUrl = 'https://blinko.kl.do' // 默认服务器

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

    // 添加错误处理
    utools.ubrowser
        .goto(url)
        .devTools('bottom')
        .evaluate(() => {
            // 检测页面是否成功加载
            window.addEventListener('error', (e) => {
                // 通知主进程页面加载错误
                utools.showNotification('连接服务器失败，请检查网络或服务器地址')
            })
            return true
        })
        .run({ width: 1200, height: 800 })
        .then(() => {
            console.log('浏览器已成功启动')
            // 显示设置页
            updateUIState(true)
        })
        .catch((err) => {
            console.error('浏览器启动失败', err)
            updateUIState(true)
            utools.showNotification('启动失败，请检查网络连接或服务器地址')
        })
} 