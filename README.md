# Valentine's Mini Arcade 💝

A playful, interactive web-based arcade with multiple mini-games, quizzes, and a heartfelt Valentine's message. Built with vanilla HTML, CSS, and JavaScript.

## 🚀 Features

- **Personality Quiz**: Discover how well you know yourself with personalized results.
- **TV Show Trivia**: Test your knowledge on shows like Modern Family, Grey's Anatomy, and K-Dramas.
- **Memory Lane**: A clickable timeline of special moments and inside jokes.
- **Word Scramble**: Unscramble words related to your favorite shows and topics.
- **Catch Hearts**: A fun, fast-paced game to test your reflexes.
- **Music Box**: A curated playlist with different moods and background music.
- **The Finale**: A special interactive question with a surprise.

## 📂 Project Structure

```
valentine-arcade/
├── index.html              # Home page with game menu
├── quiz.html               # Personality quiz page
├── trivia.html             # TV show trivia page
├── memories.html           # Memory timeline page
├── scramble.html           # Word scramble game page
├── catch.html              # Catch hearts game page
├── music.html              # Music playlist page
├── finale.html             # The big question page
├── css/
│   ├── styles.css          # Global styles and variables
│   ├── navigation.css      # Navigation bar styles
│   ├── quiz.css            # Quiz and trivia styles
│   ├── memories.css        # Memory timeline styles
│   ├── games.css           # Mini-game styles
│   ├── music.css           # Playlist styles
│   └── finale.css          # Finale section styles
├── js/
│   ├── config.js           # Central configuration object
│   ├── utils.js            # Shared utility functions
│   ├── home.js             # Home page logic
│   ├── quiz.js             # Quiz logic
│   ├── trivia.js           # Trivia logic
│   ├── memories.js         # Memories logic
│   ├── scramble.js         # Scramble game logic
│   ├── catch.js            # Catch hearts logic
│   ├── music.js            # Music logic
│   └── finale.js           # Finale logic
└── assets/                 # Folder for music and images
```

## 🛠️ Customization

Most of the content (questions, memories, songs, etc.) can be easily customized in `js/config.js`.

1. **User Info**: Update `herNameDefault` and `favourites`.
2. **Quiz/Trivia**: Edit the `quizQuestions` and `triviaQuestions` arrays.
3. **Memories**: Add your own special moments to the `memories` array.
4. **Music**: Change the links and titles in the `playlist` array.

## 📝 License

This project is open-source and created for educational and personal use. Feel free to fork and customize for your own special someone!
