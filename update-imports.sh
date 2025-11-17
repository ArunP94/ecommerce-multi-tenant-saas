#!/bin/bash

# Update form field imports
find app components __tests__ -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  's|@/components/forms/fields|@/components/domain/forms/fields|g' {} +

# Update admin component imports (specific ones)
find app components __tests__ -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  's|@/components/admin/forms/invite-user-form|@/components/domain/forms/invite-user-form|g' {} +

find app components __tests__ -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  's|@/components/admin/forms/create-store-form|@/components/domain/forms/create-store-form|g' {} +

# Update storefront imports
find app components __tests__ -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  's|@/components/storefront/preview-utils.client|@/components/domain/storefront/preview-utils.client|g' {} +

find app components __tests__ -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  's|@/components/storefront/storefront-header|@/components/domain/storefront/storefront-header|g' {} +

# Update other admin imports to domain/admin (but be careful not to double-replace)
find app __tests__ -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  's|@/components/admin/|@/components/domain/admin/|g' {} +

echo "Import paths updated!"
