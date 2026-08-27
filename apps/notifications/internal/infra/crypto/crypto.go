package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
)

type EncryptedValue struct {
	Version int    `json:"version"`
	IV      string `json:"iv"`
	Tag     string `json:"tag"`
	Data    string `json:"data"`
}

type Crypto struct {
	key []byte
}

func NewCrypto(encodedKey string) (*Crypto, error) {
	key, err := base64.StdEncoding.DecodeString(encodedKey)
	if err != nil {
		return nil, fmt.Errorf("failed to decode encryption key: %w", err)
	}
	if len(key) != 32 {
		return nil, fmt.Errorf("encryption key must be 32 bytes, got %d", len(key))
	}
	return &Crypto{key: key}, nil
}

func (c *Crypto) Encrypt(plaintext string) (string, error) {
	block, err := aes.NewCipher(c.key)
	if err != nil {
		return "", fmt.Errorf("failed to create cipher: %w", err)
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM: %w", err)
	}

	iv := make([]byte, aesGCM.NonceSize())
	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
		return "", fmt.Errorf("failed to generate IV: %w", err)
	}

	ciphertext := aesGCM.Seal(nil, iv, []byte(plaintext), nil)

	encrypted := EncryptedValue{
		Version: 1,
		IV:      base64.StdEncoding.EncodeToString(iv),
		Tag:     base64.StdEncoding.EncodeToString(ciphertext[:aesGCM.Overhead()]),
		Data:    base64.StdEncoding.EncodeToString(ciphertext[aesGCM.Overhead():]),
	}

	data, err := json.Marshal(encrypted)
	if err != nil {
		return "", fmt.Errorf("failed to marshal encrypted value: %w", err)
	}

	return string(data), nil
}

func (c *Crypto) Decrypt(value string) (string, error) {
	var encrypted EncryptedValue
	if err := json.Unmarshal([]byte(value), &encrypted); err != nil {
		return value, nil
	}

	if encrypted.Version != 1 {
		return "", fmt.Errorf("unsupported encrypted value version: %d", encrypted.Version)
	}

	block, err := aes.NewCipher(c.key)
	if err != nil {
		return "", fmt.Errorf("failed to create cipher: %w", err)
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM: %w", err)
	}

	iv, err := base64.StdEncoding.DecodeString(encrypted.IV)
	if err != nil {
		return "", fmt.Errorf("failed to decode IV: %w", err)
	}

	tag, err := base64.StdEncoding.DecodeString(encrypted.Tag)
	if err != nil {
		return "", fmt.Errorf("failed to decode tag: %w", err)
	}

	data, err := base64.StdEncoding.DecodeString(encrypted.Data)
	if err != nil {
		return "", fmt.Errorf("failed to decode data: %w", err)
	}

	ciphertext := append(tag, data...)
	plaintext, err := aesGCM.Open(nil, iv, ciphertext, nil)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt: %w", err)
	}

	return string(plaintext), nil
}

func (c *Crypto) MustEncrypt(plaintext string) string {
	encrypted, err := c.Encrypt(plaintext)
	if err != nil {
		panic(fmt.Sprintf("failed to encrypt: %v", err))
	}
	return encrypted
}

func (c *Crypto) MustDecrypt(value string) string {
	decrypted, err := c.Decrypt(value)
	if err != nil {
		panic(fmt.Sprintf("failed to decrypt: %v", err))
	}
	return decrypted
}
