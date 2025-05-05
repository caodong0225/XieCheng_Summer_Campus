import { useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';

export default function MyTravelsScreen() {
  const [travels, setTravels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: 从API获取游记列表
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-white`}>
      <FlatList
        data={travels}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: any) => (
          <TouchableOpacity
            style={tw`p-4 border-b border-gray-200`}
            onPress={() => {/* TODO: 跳转到游记详情 */}}
          >
            <Text style={tw`text-lg font-semibold`}>{item.title}</Text>
            <Text style={tw`text-gray-500 mt-1`}>{item.description}</Text>
            <Text style={tw`text-gray-400 text-sm mt-2`}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={tw`flex-1 justify-center items-center p-4`}>
            <Text style={tw`text-gray-500`}>还没有发布过游记</Text>
          </View>
        }
      />
    </View>
  );
} 