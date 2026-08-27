package crypto

import (
	"encoding/base64"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// generateTestKey menghasilkan kunci base64 32 byte untuk pengujian.
func generateTestKey(t *testing.T) string {
	t.Helper()
	key := make([]byte, 32)
	for i := range key {
		key[i] = byte(i)
	}
	return base64.StdEncoding.EncodeToString(key)
}

func TestNewCrypto(t *testing.T) {
	t.Run("membuat crypto service dengan kunci valid", func(t *testing.T) {
		encodedKey := generateTestKey(t)
		c, err := NewCrypto(encodedKey)
		require.NoError(t, err)
		assert.NotNil(t, c)
		assert.Len(t, c.key, 32)
	})

	t.Run("gagal jika kunci base64 tidak valid", func(t *testing.T) {
		_, err := NewCrypto("kunci-tidak-valid-base64!!!")
		require.Error(t, err)
		assert.Contains(t, err.Error(), "failed to decode encryption key")
	})

	t.Run("gagal jika panjang kunci bukan 32 byte", func(t *testing.T) {
		invalidKey := base64.StdEncoding.EncodeToString([]byte("kunci-16-byte-panjang"))
		_, err := NewCrypto(invalidKey)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "encryption key must be 32 bytes")
	})
}

func TestEncryptDecrypt(t *testing.T) {
	encodedKey := generateTestKey(t)
	c, err := NewCrypto(encodedKey)
	require.NoError(t, err)

	t.Run("enkripsi dan dekripsi teks biasa", func(t *testing.T) {
		plaintext := "Halo, KonkosYuk! 👋"
		encrypted, err := c.Encrypt(plaintext)
		require.NoError(t, err)
		assert.NotEmpty(t, encrypted)
		assert.NotEqual(t, plaintext, encrypted)

		decrypted, err := c.Decrypt(encrypted)
		require.NoError(t, err)
		assert.Equal(t, plaintext, decrypted)
	})

	t.Run("enkripsi string kosong", func(t *testing.T) {
		encrypted, err := c.Encrypt("")
		require.NoError(t, err)
		assert.NotEmpty(t, encrypted)

		decrypted, err := c.Decrypt(encrypted)
		require.NoError(t, err)
		assert.Equal(t, "", decrypted)
	})

	t.Run("hasil enkripsi berbeda setiap kali dijalankan (IV unik)", func(t *testing.T) {
		plaintext := "data-uji-kunci"
		enc1, err := c.Encrypt(plaintext)
		require.NoError(t, err)
		enc2, err := c.Encrypt(plaintext)
		require.NoError(t, err)
		assert.NotEqual(t, enc1, enc2, "IV seharusnya membuat ciphertext berbeda setiap enkripsi")
	})

	t.Run("dekripsi string biasa mengembalikan nilai asli", func(t *testing.T) {
		value := c.MustEncrypt("test-panen-kripto")
		result := c.MustDecrypt(value)
		assert.Equal(t, "test-panen-kripto", result)
	})
}

func TestDecryptInvalidInput(t *testing.T) {
	encodedKey := generateTestKey(t)
	c, err := NewCrypto(encodedKey)
	require.NoError(t, err)

	t.Run("dekripsi string biasa mengembalikan nilai asli tanpa error", func(t *testing.T) {
		result, err := c.Decrypt("bukan-enkripsi-json")
		require.NoError(t, err)
		assert.Equal(t, "bukan-enkripsi-json", result)
	})

	t.Run("gagal mendekripsi JSON dengan versi tidak didukung", func(t *testing.T) {
		invalidJSON := `{"version":99,"iv":"dGVzdA==","tag":"dGVzdA==","data":"dGVzdA=="}`
		_, err := c.Decrypt(invalidJSON)
		require.Error(t, err)
		assert.Contains(t, err.Error(), "unsupported encrypted value version")
	})

	t.Run("gagal mendekripsi ciphertext yang telah diubah", func(t *testing.T) {
		encrypted, err := c.Encrypt("rahasia-keren")
		require.NoError(t, err)

		// ubah satu byte di bagian data agar autentikasi GCM gagal
		// dengan memanipulasi string JSON secara langsung
		idx := strings.Index(encrypted, `"data":"`) + len(`"data":"`)
		if idx >= len(`"data":"`) {
			modified := encrypted[:idx] + "dGVzdA==" + encrypted[idx+len("dGVzdzdA=="):]
			_, err = c.Decrypt(modified)
			require.Error(t, err)
			assert.Contains(t, err.Error(), "failed to")
		}
	})
}

func TestMustEncryptDecrypt(t *testing.T) {
	encodedKey := generateTestKey(t)
	c, err := NewCrypto(encodedKey)
	require.NoError(t, err)

	t.Run("MustEncrypt berhasil tanpa panic", func(t *testing.T) {
		result := c.MustEncrypt("data-aman")
		assert.NotEmpty(t, result)
	})

	t.Run("MustDecrypt berhasil tanpa panic", func(t *testing.T) {
		enc := c.MustEncrypt("data-aman")
		result := c.MustDecrypt(enc)
		assert.Equal(t, "data-aman", result)
	})
}
