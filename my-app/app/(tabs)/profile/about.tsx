import { ScrollView, Text, View } from 'react-native';
import tw from 'twrnc';

export default function AboutScreen() {
  return (
    <ScrollView style={tw`flex-1 bg-white`}>
      <View style={tw`p-4`}>
        <View style={tw`mb-6`}>
          <Text style={tw`text-2xl font-bold mb-2`}>关于应用</Text>
          <Text style={tw`text-gray-600`}>
            这是一个旅行分享应用，让您可以记录和分享您的旅行经历。
          </Text>
        </View>

        <View style={tw`mb-6`}>
          <Text style={tw`text-xl font-semibold mb-2`}>版本信息</Text>
          <Text style={tw`text-gray-600`}>当前版本：1.0.0</Text>
        </View>

        <View style={tw`mb-6`}>
          <Text style={tw`text-xl font-semibold mb-2`}>联系我们</Text>
          <Text style={tw`text-gray-600`}>
            如果您有任何问题或建议，请通过以下方式联系我们：
          </Text>
          <Text style={tw`text-blue-500 mt-2`}>support@example.com</Text>
        </View>

        <View style={tw`mb-6`}>
          <Text style={tw`text-xl font-semibold mb-2`}>隐私政策</Text>
          <Text style={tw`text-gray-600`}>
            我们重视您的隐私，您可以查看我们的隐私政策了解详情。
          </Text>
        </View>

        <View style={tw`mb-6`}>
          <Text style={tw`text-xl font-semibold mb-2`}>使用条款</Text>
          <Text style={tw`text-gray-600`}>
            使用本应用即表示您同意我们的使用条款。
          </Text>
        </View>
      </View>
    </ScrollView>
  );
} 