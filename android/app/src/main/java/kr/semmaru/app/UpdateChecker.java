package kr.semmaru.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class UpdateChecker {

    private static final String RELEASES_URL =
            "https://api.github.com/repos/insushim/iswflowmath/releases/latest";

    /**
     * GitHub Releases API를 호출하여 새 버전이 있는지 확인한다.
     * 네트워크 에러 시 무시한다 (silent fail).
     */
    public static void check(Activity activity) {
        ExecutorService executor = Executors.newSingleThreadExecutor();
        Handler handler = new Handler(Looper.getMainLooper());

        executor.execute(() -> {
            try {
                URL url = new URL(RELEASES_URL);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setRequestProperty("Accept", "application/vnd.github.v3+json");
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);

                int responseCode = conn.getResponseCode();
                if (responseCode != 200) {
                    conn.disconnect();
                    return;
                }

                BufferedReader reader = new BufferedReader(
                        new InputStreamReader(conn.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
                reader.close();
                conn.disconnect();

                JSONObject release = new JSONObject(sb.toString());
                String tagName = release.getString("tag_name");
                String latestVersion = tagName.startsWith("v") ? tagName.substring(1) : tagName;
                String currentVersion = BuildConfig.VERSION_NAME;

                if (isNewerVersion(currentVersion, latestVersion)) {
                    // APK 다운로드 URL 추출
                    String downloadUrl = null;
                    JSONArray assets = release.optJSONArray("assets");
                    if (assets != null && assets.length() > 0) {
                        downloadUrl = assets.getJSONObject(0)
                                .getString("browser_download_url");
                    }

                    final String apkUrl = downloadUrl;
                    final String displayVersion = tagName.startsWith("v") ? tagName : "v" + tagName;

                    handler.post(() -> {
                        if (activity.isFinishing() || activity.isDestroyed()) return;
                        showUpdateDialog(activity, displayVersion, apkUrl);
                    });
                }

            } catch (Exception e) {
                // 네트워크 에러 시 무시 (silent fail)
            }
        });

        executor.shutdown();
    }

    /**
     * 세 부분 버전(major.minor.patch) 비교.
     * latest가 current보다 높으면 true.
     */
    private static boolean isNewerVersion(String current, String latest) {
        try {
            int[] cur = parseVersion(current);
            int[] lat = parseVersion(latest);

            for (int i = 0; i < 3; i++) {
                if (lat[i] > cur[i]) return true;
                if (lat[i] < cur[i]) return false;
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    private static int[] parseVersion(String version) {
        String[] parts = version.split("\\.");
        int[] result = new int[3];
        for (int i = 0; i < Math.min(parts.length, 3); i++) {
            result[i] = Integer.parseInt(parts[i]);
        }
        return result;
    }

    private static void showUpdateDialog(Activity activity, String version, String apkUrl) {
        new AlertDialog.Builder(activity)
                .setTitle("업데이트 안내")
                .setMessage("새 버전 " + version + "이(가) 있습니다.\n업데이트하시겠습니까?")
                .setPositiveButton("업데이트", (dialog, which) -> {
                    if (apkUrl != null) {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(apkUrl));
                        activity.startActivity(intent);
                    }
                })
                .setNegativeButton("나중에", (dialog, which) -> dialog.dismiss())
                .setCancelable(true)
                .show();
    }
}
