# WebView
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep BuildConfig
-keep class kr.semmaru.app.BuildConfig { *; }

# JSON parsing
-keepclassmembers class org.json.** { *; }
