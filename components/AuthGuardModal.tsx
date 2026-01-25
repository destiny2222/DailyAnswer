import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface AuthGuardModalProps {
    visible: boolean;
    onClose: () => void;
}

const AuthGuardModal: React.FC<AuthGuardModalProps> = ({ visible, onClose }) => {
    const router = useRouter();

    const handleCreateAccount = () => {
        onClose();
        router.push('/(auth)/signup');
    };

    const handleSignIn = () => {
        onClose();
        router.push('/(auth)/login');
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1}
                    onPress={onClose}
                >
                </TouchableOpacity>
                <View style={styles.contentContainer}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <Ionicons name="close" size={24} color="#999" />
                    </TouchableOpacity>

                    <View style={styles.content}>
                        <Text style={styles.title}>Access the Full Experience</Text>
                        <Text style={styles.description}>
                            Create an account , access thousands of Plans and Highlights, and read offline. No ads or paywalls—ever!
                        </Text>

                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={handleCreateAccount}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.createButtonText}>Create Account</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.signInButton}
                            onPress={handleSignIn}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.signInButtonText}>Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    blurContainer: {
        flex: 1,
    },
    contentContainer: {
        width: '85%',
        maxWidth: 400,
        backgroundColor: '#2c2c2e',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        padding: 8,
    },
    content: {
        alignItems: 'center',
        paddingTop: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 34,
    },
    description: {
        fontSize: 15,
        color: '#B0B0B0',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
        paddingHorizontal: 8,
    },
    createButton: {
        width: '100%',
        backgroundColor: '#FF6B6B',
        paddingVertical: 16,
        borderRadius: 25,
        marginBottom: 12,
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    signInButton: {
        width: '100%',
        backgroundColor: '#4A4A4C',
        paddingVertical: 16,
        borderRadius: 25,
    },
    signInButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default AuthGuardModal;
