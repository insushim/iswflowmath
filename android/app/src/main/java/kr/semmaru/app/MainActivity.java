package kr.semmaru.app;

import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private static final String BASE_URL = "https://semmaru.pages.dev";
    private static final String BASE_HOST = "semmaru.pages.dev";

    private WebView webView;
    private ProgressBar progressBar;
    private boolean isOffline = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);
        progressBar = findViewById(R.id.progressBar);

        setupWebView();
        webView.loadUrl(BASE_URL);

        // 앱 시작 시 업데이트 확인
        UpdateChecker.check(this);
    }

    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);

        // 쿠키 허용
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        // WebViewClient: 같은 도메인은 앱 내, 외부는 브라우저
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String host = request.getUrl().getHost();
                if (host != null && host.endsWith(BASE_HOST)) {
                    return false; // 앱 내에서 처리
                }
                // 외부 링크는 브라우저로
                Intent intent = new Intent(Intent.ACTION_VIEW, request.getUrl());
                startActivity(intent);
                return true;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                isOffline = false;
                progressBar.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                progressBar.setVisibility(View.GONE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                // 메인 프레임 에러일 때만 오프라인 화면 표시
                if (request.isForMainFrame()) {
                    isOffline = true;
                    showOfflinePage(view);
                }
            }
        });

        // WebChromeClient: 프로그레스바
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setProgress(newProgress);
                if (newProgress == 100) {
                    progressBar.setVisibility(View.GONE);
                }
            }
        });
    }

    private void showOfflinePage(WebView view) {
        String offlineHtml = "<!DOCTYPE html><html><head>" +
                "<meta name='viewport' content='width=device-width,initial-scale=1'>" +
                "<style>" +
                "body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;" +
                "min-height:100vh;margin:0;background:#020617;color:#e2e8f0;text-align:center;}" +
                ".container{padding:2rem;}" +
                ".icon{font-size:4rem;margin-bottom:1rem;}" +
                "h2{color:#6366f1;margin-bottom:0.5rem;}" +
                "p{color:#94a3b8;margin-bottom:1.5rem;}" +
                "button{background:#6366f1;color:white;border:none;padding:12px 24px;" +
                "border-radius:8px;font-size:1rem;cursor:pointer;}" +
                "button:active{background:#4f46e5;}" +
                "</style></head><body>" +
                "<div class='container'>" +
                "<div class='icon'>&#128268;</div>" +
                "<h2>인터넷 연결 없음</h2>" +
                "<p>네트워크 연결을 확인하고 다시 시도해주세요.</p>" +
                "<button onclick='window.location.reload()'>다시 시도</button>" +
                "</div></body></html>";
        view.loadDataWithBaseURL(null, offlineHtml, "text/html", "UTF-8", null);
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        if (webView.canGoBack() && !isOffline) {
            webView.goBack();
        } else {
            new AlertDialog.Builder(this)
                    .setTitle("셈마루")
                    .setMessage("앱을 종료하시겠습니까?")
                    .setPositiveButton("종료", (dialog, which) -> finish())
                    .setNegativeButton("취소", null)
                    .show();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
        webView.onPause();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
