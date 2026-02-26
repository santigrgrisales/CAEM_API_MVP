import pandas as pd
import chardet

# Detect file encoding
with open('embargos_50k.csv', 'rb') as f:
    result = chardet.detect(f.read(10000))
    print(f"Detected encoding: {result['encoding']} with confidence {result['confidence']}")

# Read file with proper encoding handling
try:
    # First try with detected encoding
    df = pd.read_csv('embargos_50k.csv', encoding=result['encoding'], on_bad_lines='warn')
except UnicodeDecodeError:
    # Fallback to latin1 if needed
    df = pd.read_csv('embargos_50k.csv', encoding='latin1', on_bad_lines='warn')

# Clean problematic characters in specific columns
str_cols = df.select_dtypes(include=['object']).columns
for col in str_cols:
    df[col] = df[col].str.encode('latin1', 'ignore').str.decode('utf-8', 'ignore')

# Save cleaned file
df.to_csv('embargos_clean.csv', index=False, encoding='utf-8')
print("File cleaned and saved as 'embargos_clean.csv'")
