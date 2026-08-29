import java.util.Properties

plugins {
    id("com.android.application")
}

val signingFile = rootProject.file("keystore.properties")
val signing = Properties().apply {
    if (signingFile.exists()) signingFile.inputStream().use(::load)
}

android {
    namespace = "com.darcloud.ecosystem"
    compileSdk = 36

    defaultConfig {
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"
    }

    flavorDimensions += "app"
    productFlavors {
        create("wallet") {
            dimension = "app"
            applicationId = "com.daralnas.wallet"
            resValue("string", "app_name", "Dar Wallet Research")
            resValue("string", "app_subtitle", "Non-financial budgeting research; no account or money movement")
            buildConfigField("String", "HOME_URL", "\"https://wallet.darcloud.host/\"")
            buildConfigField("String", "INTERNAL_PATH_PREFIX", "\"/\"")
        }
        create("logistics") {
            dimension = "app"
            applicationId = "com.darcloud.logistics"
            resValue("string", "app_name", "Dar Logistics")
            resValue("string", "app_subtitle", "Internal preview; fictional data, no live operations")
            buildConfigField("String", "HOME_URL", "\"https://logistics.darcloud.host/\"")
            buildConfigField("String", "INTERNAL_PATH_PREFIX", "\"/\"")
        }
        create("meshtalk") {
            dimension = "app"
            applicationId = "com.darcloud.meshtalk"
            resValue("string", "app_name", "MeshTalk")
            resValue("string", "app_subtitle", "Beta direct/group text; no E2EE, calls, media, or push")
            buildConfigField("String", "HOME_URL", "\"https://darcloud.host/meshtalk\"")
            buildConfigField("String", "INTERNAL_PATH_PREFIX", "\"/meshtalk\"")
        }
        create("quranchain") {
            dimension = "app"
            applicationId = "com.quranchain.rewards"
            resValue("string", "app_name", "QuranChain Tracker")
            resValue("string", "app_subtitle", "Private prayer/Quran tracker; no token rewards, mining, or financial value")
            buildConfigField("String", "HOME_URL", "\"https://quranchain.darcloud.host/\"")
            buildConfigField("String", "INTERNAL_PATH_PREFIX", "\"/\"")
        }
    }

    signingConfigs {
        if (signingFile.exists()) {
            create("release") {
                storeFile = rootProject.file(signing.getProperty("storeFile"))
                storePassword = signing.getProperty("storePassword")
                keyAlias = signing.getProperty("keyAlias")
                keyPassword = signing.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        getByName("release") {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (signingFile.exists()) signingConfig = signingConfigs.getByName("release")
        }
    }

    buildFeatures { buildConfig = true }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
