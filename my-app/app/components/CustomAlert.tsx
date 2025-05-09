import { Modal, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons: Array<{
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  onDismiss: () => void;
}

export default function CustomAlert({ visible, title, message, buttons, onDismiss }: CustomAlertProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={tw`flex-1 justify-center items-center bg-black/50`}>
        <View style={tw`bg-white rounded-lg w-[80%] max-w-[400px] overflow-hidden`}>
          <View style={tw`p-4 border-b border-gray-200`}>
            <Text style={tw`text-lg font-bold text-center`}>{title}</Text>
            {message && (
              <Text style={tw`text-base text-gray-600 text-center mt-2`}>{message}</Text>
            )}
          </View>
          <View style={tw`flex-row border-t border-gray-200`}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={button.text}
                onPress={() => {
                  button.onPress();
                  onDismiss();
                }}
                style={[
                  tw`flex-1 py-3`,
                  index > 0 && tw`border-l border-gray-200`,
                  button.style === 'destructive' && tw`bg-red-50`,
                  button.style === 'cancel' && tw`bg-gray-50`
                ]}
              >
                <Text
                  style={[
                    tw`text-center text-base`,
                    button.style === 'destructive' && tw`text-red-500`,
                    button.style === 'cancel' && tw`text-gray-500`,
                    !button.style && tw`text-blue-500`
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
} 