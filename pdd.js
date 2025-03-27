// ==UserScript==
// @name         PDD Data Get
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description
// @author       顿玄
// @match        https://mobile.pinduoduo.com/*
// @match        https://mobile.yangkeduo.com/*
// @grant        none
// @downloadURL https://raw.githubusercontent.com/dunxuan/PDD-Data-Get/refs/heads/main/pdd.js
// @updateURL https://raw.githubusercontent.com/dunxuan/PDD-Data-Get/refs/heads/main/pdd.js
// ==/UserScript==

(function () {
    'use strict';

    const DOMAINS = ['https://mobile.pinduoduo.com', 'https://mobile.yangkeduo.com'];

    // 目标 API 的 URL 前缀数组
    const API_PATHS = [
        '/proxy/api/api/caterham/query/fenlei_gyl_group',
        '/proxy/api/search'
    ];
    const API_URL_PREFIXES = DOMAINS.flatMap(domain => API_PATHS.map(path => `${domain}${path}`));

    // 目标 HTML 的 URL 前缀数组
    const HTML_PATHS = [
        '/?lastTabItemID=',
        '/?page_id=',
        '/search_result.html',
        '/mall_page.html',
        '/goods.html'
    ];
    const RAW_URL_PREFIXES = DOMAINS.flatMap(domain => HTML_PATHS.map(path => `${domain}${path}`));

    // 重写 XMLHttpRequest 的 open 方法
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
        if (API_URL_PREFIXES.some(prefix => url.startsWith(prefix))) {
            this.addEventListener('load', function () {
                handleApiResponse(this.responseText, 'pinduoduo_api_data.json');
            });
        }
        return originalXhrOpen.apply(this, arguments);
    };

    // 处理 API 响应
    function handleApiResponse(responseText, filename) {
        try {
            const json = JSON.parse(responseText);
            downloadJson(json, filename);
        } catch (error) {
            console.error('解析失败:', error);
        }
    }

    // 辅助函数：将 JSON 数据下载为文件
    function downloadJson(jsonData, filename) {
        const jsonStr = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    // 检查当前页面 URL 并提取 window.rawData
    function checkAndExtractRawData() {
        const currentUrl = window.location.href;
        if (RAW_URL_PREFIXES.some(prefix => currentUrl.startsWith(prefix))) {
            if (typeof window.rawData !== 'undefined') {
                try {
                    const rawData = JSON.parse(JSON.stringify(window.rawData));
                    downloadJson(rawData, 'pinduoduo_raw_data.json');
                } catch (error) {
                    console.error('解析 window.rawData 失败:', error);
                }
            }
        }
    }

    // 页面加载完成后检查并提取数据
    window.addEventListener('load', checkAndExtractRawData);

})();