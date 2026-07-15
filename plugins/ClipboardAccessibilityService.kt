package com.omgit.clipio

import android.accessibilityservice.AccessibilityService
import android.content.ClipboardManager
import android.content.Context
import android.view.accessibility.AccessibilityEvent
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

class ClipboardAccessibilityService : AccessibilityService() {

    private var lastText: String = ""

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        try {
            // Update service status file so the frontend knows we are running
            saveServiceStatus()

            val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            if (clipboard.hasPrimaryClip()) {
                val clip = clipboard.primaryClip
                if (clip != null && clip.itemCount > 0) {
                    val text = clip.getItemAt(0).text?.toString() ?: ""
                    if (text.isNotEmpty() && text != lastText) {
                        lastText = text
                        saveToBackgroundClips(text)
                    }
                }
            }
        } catch (e: Exception) {
            // Quiet fail
        }
    }

    override fun onInterrupt() {}

    private fun saveServiceStatus() {
        try {
            val file = File(filesDir, "service_status.json")
            val json = JSONObject()
            json.put("active", true)
            json.put("timestamp", System.currentTimeMillis())
            file.writeText(json.toString())
        } catch (e: Exception) {
            // Quiet fail
        }
    }

    private fun saveToBackgroundClips(text: String) {
        try {
            val file = File(filesDir, "background_clips.json")
            val jsonArray = if (file.exists()) {
                try {
                    JSONArray(file.readText())
                } catch (e: Exception) {
                    JSONArray()
                }
            } else {
                JSONArray()
            }

            // Check if last element is identical to avoid double saves
            if (jsonArray.length() > 0 && jsonArray.getString(jsonArray.length() - 1) == text) {
                return
            }

            jsonArray.put(text)
            file.writeText(jsonArray.toString())
        } catch (e: Exception) {
            // Quiet fail
        }
    }
}
