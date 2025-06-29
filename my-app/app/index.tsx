// app/index.tsx
import { isLoggedIn } from '@/store/token';
import { setupNotificationChannel } from '@/utils/notification';
import * as Notifications from 'expo-notifications';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // 设置 Android 通知通道
        await setupNotificationChannel();

        // 请求通知权限（iOS、Android）
        if (Platform.OS === 'web') {
          // Web 平台使用浏览器的 Notification 权限
          if (typeof window !== 'undefined' && 'Notification' in window && typeof Notification !== 'undefined') {
            try {
              // 检查当前权限状态
              if (Notification.permission === 'default') {
                // 权限未设置，显示权限请求弹窗
                setShowPermissionModal(true);
                console.log('📱 显示Web通知权限请求弹窗');
              } else if (Notification.permission === 'denied') {
                // 权限被拒绝
                setShowPermissionModal(true);
                console.warn('🚫 Web 通知权限被拒绝');
              } else if (Notification.permission === 'granted') {
                console.log('✅ Web 通知权限已授权');
              }
            } catch (error) {
              console.warn('🚫 Web 通知权限检查失败:', error);
            }
          } else {
            console.warn('🚫 当前浏览器不支持 Web 通知');
          }
        } else {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== 'granted') {
            setShowPermissionModal(true);
            console.warn('通知权限未授权');
          } else {
            console.log('✅ 通知权限已授权');
          }
        }

        // 监听通知点击行为（可选）
        const sub = Notifications.addNotificationResponseReceivedListener(
          response => {
            console.log('🔔 用户点击通知:', response);
          }
        );

        // 登录状态检测
        const loginStatus = await isLoggedIn();
        setLoggedIn(loginStatus);

        return () => sub.remove();
      } catch (err) {
        console.error('初始化出错:', err);
        setLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* 当通知权限未开启时显示 Modal 提示 */}
      <Modal
        visible={showPermissionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPermissionModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>通知权限未开启</Text>
            <Text style={styles.modalMessage}>
              {Platform.OS === 'web' 
                ? '为了不错过重要消息，请允许浏览器发送通知。' 
                : '为了不错过重要消息，请在系统设置中开启通知权限。'
              }
            </Text>
            <View style={styles.buttonContainer}>
              {Platform.OS === 'web' && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.primaryButton]}
                  onPress={async () => {
                    try {
                      if (typeof window !== 'undefined' && 'Notification' in window) {
                        const permission = await Notification.requestPermission();
                        if (permission === 'granted') {
                          console.log('✅ Web 通知权限已授权');
                          setShowPermissionModal(false);
                        } else {
                          console.warn('🚫 用户拒绝了Web通知权限');
                        }
                      }
                    } catch (error) {
                      console.warn('🚫 请求Web通知权限失败:', error);
                    }
                  }}
                >
                  <Text style={styles.primaryButtonText}>允许通知</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={() => setShowPermissionModal(false)}
              >
                <Text style={styles.secondaryButtonText}>稍后再说</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loggedIn ? <Redirect href="/(tabs)/home" /> : <Redirect href="/(auth)/login" />}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flex: 1,
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#CCCCCC',
  },
  secondaryButtonText: {
    color: 'black',
    fontSize: 16,
  },
});
