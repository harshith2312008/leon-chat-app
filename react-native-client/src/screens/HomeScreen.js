import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen({ navigation, route }) {
    const { user, socket } = route.params;
    const [friends, setFriends] = useState([]);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        fetchFriends();
        // Listen for updates
        socket.on('friend_request_accepted', fetchFriends);
        return () => {
            socket.off('friend_request_accepted', fetchFriends);
        };
    }, []);

    const fetchFriends = async () => {
        try {
            const res = await api.get(`/friends/${user.id}`);
            setFriends(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Chat', { friend: item, user, socket })}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.username[0].toUpperCase()}</Text>
            </View>
            <Text style={styles.username}>{item.username}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.title}>Chats</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Search', { user })}>
                    <Text style={styles.searchLink}>Search Users</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={friends}
                keyExtractor={item => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.empty}>No friends yet</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    searchLink: {
        color: '#646cff',
        fontSize: 16,
    },
    list: {
        padding: 20,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#1E1E1E',
        borderRadius: 12,
        marginBottom: 10,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#646cff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 18,
    },
    username: {
        color: '#fff',
        fontSize: 18,
    },
    empty: {
        color: '#666',
        textAlign: 'center',
        marginTop: 50,
    },
});
