import 'package:flutter/material.dart';
import 'package:hive/hive.dart';

import '../models/category.dart';

class CategoryProvider with ChangeNotifier {
  late Box<Category> _categoryBox;
  List<Category> _categories = [];

  final List<Color> defaultColors = [
    Colors.red,
    Colors.blue,
    Colors.green,
    Colors.orange,
    Colors.purple,
    Colors.teal,
    Colors.pink,
    Colors.indigo,
  ];

  CategoryProvider() {
    _initCategories();
  }

  List<Category> get categories => _categories;

  Future<void> _initCategories() async {
    _categoryBox = await Hive.openBox<Category>('categories');
    if (_categoryBox.isEmpty) {
      _addDefaultCategories();
    } else {
      _categories = _categoryBox.values.toList();
    }
    notifyListeners();
  }

  void _addDefaultCategories() {
    final defaultCategoryNames = [
      'Food',
      'Transport',
      'Utilities',
      'Entertainment',
      'Shopping',
      'Health',
      'Education',
      'Other',
    ];
    for (int i = 0; i < defaultCategoryNames.length; i++) {
      final category = Category(
        id: generateUuid(),
        name: defaultCategoryNames[i],
        colorValue: defaultColors[i % defaultColors.length].value,
      );
      _categoryBox.put(category.id, category);
      _categories.add(category);
    }
  }

  Category? getCategoryById(String id) {
    return _categoryBox.get(id);
  }

  void addCategory(Category category) {
    _categoryBox.put(category.id, category);
    _categories.add(category);
    notifyListeners();
  }

  void updateCategory(Category category) {
    _categoryBox.put(category.id, category);
    _categories = _categoryBox.values.toList();
    notifyListeners();
  }

  void deleteCategory(String id) {
    _categoryBox.delete(id);
    _categories.removeWhere((cat) => cat.id == id);
    notifyListeners();
  }
}

