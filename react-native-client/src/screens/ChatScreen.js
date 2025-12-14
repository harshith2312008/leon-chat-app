import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import api from '../api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';

export default function ChatScreen({ route, navigation }) {
    const { user, friend, socket } = route.params;
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const flatListRef = useRef();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        navigation.setOptions({ title: friend.username });
        fetchMessages();

        // Listen
        socket.on('receive_message', (msg) => {
            if (msg.senderId === friend.id) {
                setMessages(prev => [...prev, msg]);
            }
        });

        return () => {
            socket.off('receive_message');
        };
    }, []);

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/messages/${user.id}/${friend.id}`);
            setMessages(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const sendMessage = () => {
        if (!input.trim()) return;

        socket.emit('private_message', {
            senderId: user.id,
            receiverId: friend.id,
            content: input
        });

        // Optimistic
        setMessages(prev => [...prev, {
            senderId: user.id,
            receiverId: friend.id,
            content: input,
            timestamp: new Date().toISOString()
        }]);

        setInput('');
    };

    const renderItem = ({ item }) => {
        const isMe = item.senderId === user.id;
        return (
            <View style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
                <Text style={styles.bubbleText}>{item.content}</Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { paddingBottom: insets.bottom }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Message..."
                    placeholderTextColor="#666"
                />
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                    <Send color="white" size={24} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    list: {
        padding: 20,
    },
    bubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
    },
    bubbleLeft: {
        alignSelf: 'flex-start',
        backgroundColor: '#1E1E1E',
    },
    bubbleRight: {
        alignSelf: 'flex-end',
        backgroundColor: '#646cff',
    },
    bubbleText: {
        color: '#fff',
        fontSize: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#333',
        backgroundColor: '#1E1E1E',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#2C2C2C',
        color: '#fff',
        padding: 10,
        borderRadius: 20,
        marginRight: 10,
    },
    sendButton: {
        padding: 10,
        backgroundColor: '#646cff',
        borderRadius: 20,
    },
});
