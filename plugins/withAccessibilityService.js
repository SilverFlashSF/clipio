const { withAndroidManifest, withDangerousMod, withStringsXml } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withAccessibilityService(config) {
  // 1. AndroidManifest modifications
  config = withAndroidManifest(config, async (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    
    if (!mainApplication.service) {
      mainApplication.service = [];
    }
    
    const hasService = mainApplication.service.some(
      (s) => s.$['android:name'] === 'com.omgit.clipio.ClipboardAccessibilityService'
    );
    
    if (!hasService) {
      mainApplication.service.push({
        $: {
          'android:name': 'com.omgit.clipio.ClipboardAccessibilityService',
          'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.view.accessibility.AccessibilityService',
                },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.accessibilityservice',
              'android:resource': '@xml/accessibility_service_config',
            },
          },
        ],
      });
    }
    
    return config;
  });

  // 2. Add string resource
  config = withStringsXml(config, (config) => {
    const strings = config.modResults.resources.string || [];
    
    const hasDesc = strings.some(
      (s) => s.$.name === 'accessibility_service_description'
    );
    
    if (!hasDesc) {
      config.modResults.resources.string.push({
        $: { name: 'accessibility_service_description' },
        _: 'Clipboard helper for Clipio to capture clipboard history in background.',
      });
    }
    
    return config;
  });

  // 3. Dangerous modifications (Copy Kotlin file + Create XML config)
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const root = config.modRequest.platformProjectRoot;
      
      const kotlinDest = path.join(
        root,
        'app/src/main/java/com/omgit/clipio/ClipboardAccessibilityService.kt'
      );
      
      fs.mkdirSync(path.dirname(kotlinDest), { recursive: true });
      
      const kotlinSource = path.join(
        config.modRequest.projectRoot,
        'plugins/ClipboardAccessibilityService.kt'
      );
      fs.copyFileSync(kotlinSource, kotlinDest);

      const xmlDest = path.join(
        root,
        'app/src/main/res/xml/accessibility_service_config.xml'
      );
      fs.mkdirSync(path.dirname(xmlDest), { recursive: true });

      const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeViewClicked|typeViewFocused|typeViewTextChanged|typeWindowStateChanged"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagDefault"
    android:canRetrieveWindowContent="false"
    android:description="@string/accessibility_service_description" />`;

      fs.writeFileSync(xmlDest, xmlContent, 'utf8');

      return config;
    },
  ]);

  return config;
}

module.exports = withAccessibilityService;
