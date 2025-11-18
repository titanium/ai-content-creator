
#!/bin/bash

# Content Creator Backend Setup Script
# Run this from your backend folder

echo "🚀 Setting up Content Creator Backend..."
echo ""

# Create directory structure
echo "📁 Creating folder structure..."
mkdir -p src/controllers
mkdir -p src/middleware
mkdir -p src/routes
mkdir -p src/services

# Create all necessary files
echo "📝 Creating files..."
touch src/server.js
touch src/controllers/authController.js
touch src/controllers/contentController.js
touch src/controllers/subscriptionController.js
touch src/middleware/authMiddleware.js
touch src/middleware/trialMiddleware.js
touch src/routes/authRoutes.js
touch src/routes/contentRoutes.js
touch src/routes/subscriptionRoutes.js
touch src/services/anthropicService.js
touch src/services/stripeService.js

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📄 Creating .env file..."
    touch .env
    echo "⚠️  Remember to fill in your .env file with API keys!"
fi

echo ""
echo "✅ Folder structure created!"
echo ""
echo "Your structure:"
find src -type f | sort

echo ""
echo "📋 Next steps:"
echo "1. Copy the code from each artifact into the corresponding file"
echo "2. Fill in your .env file with your API keys"
echo "3. Run: npm install"
echo "4. Run: npx prisma generate"
echo "5. Run: npx prisma migrate dev --name init"
echo "6. Run: npm run dev"
echo ""
echo "Happy coding! 🎉"