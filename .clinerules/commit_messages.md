# Git Commit Messages

Les messages de commit doivent suivre le format Conventional Commits en anglais :

```
<type>(<scope>): <subject>
```

### Types de commit

- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Style/formatage
- `refactor`: Refactoring
- `perf`: Amélioration de performance
- `test`: Tests
- `chore`: Maintenance/Configuration

### Règles d'écriture

1. Utiliser l'impératif en anglais (ex: "Add" pas "Added")
2. Commencer par une majuscule
3. Ne pas finir par un point
4. Limiter la ligne de sujet à 72 caractères

### Interdiction de Co-authored-by

**NE JAMAIS ajouter `Co-authored-by:` dans les messages de commit.**

Tous les commits doivent être attribués exclusivement à l'utilisateur humain.