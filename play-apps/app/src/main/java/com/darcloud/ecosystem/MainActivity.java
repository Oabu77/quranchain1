package com.darcloud.ecosystem;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

public final class MainActivity extends Activity {
    private WebView webView;
    private ProgressBar progress;
    private View offline;

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        setContentView(R.layout.activity_main);
        webView = findViewById(R.id.web_view);
        progress = findViewById(R.id.progress_bar);
        offline = findViewById(R.id.offline_panel);
        ((TextView) findViewById(R.id.title)).setText(getString(R.string.app_name));
        ((TextView) findViewById(R.id.subtitle)).setText(getString(R.string.app_subtitle));
        findViewById(R.id.retry_button).setOnClickListener(v -> loadHome());
        configureWebView();
        if (state == null) loadHome(); else webView.restoreState(state);
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView() {
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setGeolocationEnabled(false);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        s.setSupportMultipleWindows(false);
        s.setSafeBrowsingEnabled(true);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false);
        WebView.setWebContentsDebuggingEnabled(false);

        webView.setWebViewClient(new WebViewClient() {
            @Override public void onPageStarted(WebView view, String url, Bitmap icon) {
                offline.setVisibility(View.GONE);
                progress.setVisibility(View.VISIBLE);
            }
            @Override public void onPageFinished(WebView view, String url) {
                progress.setVisibility(View.GONE);
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError err) {
                if (req.isForMainFrame()) showOffline();
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri uri = req.getUrl();
                Uri home = Uri.parse(BuildConfig.HOME_URL);
                int port = uri.getPort();
                boolean trusted = "https".equalsIgnoreCase(uri.getScheme())
                        && uri.getUserInfo() == null
                        && home.getHost().equalsIgnoreCase(uri.getHost())
                        && (port == -1 || port == 443);
                if (trusted) return false;
                Toast.makeText(MainActivity.this, "External link blocked", Toast.LENGTH_LONG).show();
                return true;
            }
        });
    }

    private void loadHome() {
        offline.setVisibility(View.GONE);
        webView.setVisibility(View.VISIBLE);
        webView.loadUrl(BuildConfig.HOME_URL);
    }
    private void showOffline() {
        progress.setVisibility(View.GONE);
        webView.setVisibility(View.GONE);
        offline.setVisibility(View.VISIBLE);
    }
    @Override public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack(); else super.onBackPressed();
    }
    @Override protected void onSaveInstanceState(Bundle out) {
        webView.saveState(out);
        super.onSaveInstanceState(out);
    }
    @Override protected void onDestroy() {
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
        }
        super.onDestroy();
    }
}
