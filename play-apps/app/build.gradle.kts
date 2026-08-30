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
            resValue("string", "app_name", "Dar Wallet")
            resValue("string", "app_subtitle", "Private account prototype")
            buildConfigField("String", "HOME_URL", "\"https://banking.darcloud.host/\"")
        }
        create("logistics") {
            dimension = "app"
            applicationId = "com.darcloud.logistics"
            resValue("string", "app_name", "Dar Logistics")
            resValue("string", "app_subtitle", "Shipping and fleet tools")
            buildConfigField("String", "HOME_URL", "\"https://logistics.darcloud.host/\"")
        }
        create("meshtalk") {
            dimension = "app"
            applicationId = "com.darcloud.meshtalk"
            versionCode = 2
            versionName = "1.0.1"
            resValue("string", "app_name", "MeshTalk")
            resValue("string", "app_subtitle", "Resilient community communications")
            buildConfigField("String", "HOME_URL", "\"https://fungios.darcloud.host/\"")
        }
        create("quranchain") {
            dimension = "app"
            applicationId = "com.quranchain.rewards"
            resValue("string", "app_name", "QuranChain Rewards")
            resValue("string", "app_subtitle", "Prayer, reading and test rewards")
            buildConfigField("String", "HOME_URL", "\"https://darcloud.host/\"")
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
