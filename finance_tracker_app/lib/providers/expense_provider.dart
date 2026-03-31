import 'package:flutter/foundation.dart';
import 'package:hive/hive.dart';

import '../models/expense.dart';
import '../models/category.dart';

class ExpenseProvider with ChangeNotifier {
  late Box<Expense> _expenseBox;
  List<Expense> _expenses = [];

  ExpenseProvider() {
    _initExpenses();
  }

  List<Expense> get expenses => _expenses;

  double get totalExpenses {
    return _expenses.fold(0.0, (sum, item) => sum + item.amount);
  }

  Future<void> _initExpenses() async {
    _expenseBox = await Hive.openBox<Expense>('expenses');
    _expenses = _expenseBox.values.toList()
      ..sort((a, b) => b.date.compareTo(a.date));
    notifyListeners();
  }

  void addExpense(Expense expense) {
    _expenseBox.put(expense.id, expense);
    _expenses.add(expense);
    _expenses.sort((a, b) => b.date.compareTo(a.date));
    notifyListeners();
  }

  void updateExpense(Expense expense) {
    _expenseBox.put(expense.id, expense);
    _expenses = _expenseBox.values.toList()
      ..sort((a, b) => b.date.compareTo(a.date));
    notifyListeners();
  }

  void deleteExpense(String id) {
    _expenseBox.delete(id);
    _expenses.removeWhere((exp) => exp.id == id);
    notifyListeners();
  }

  bool hasExpensesForCategory(String categoryId) {
    return _expenses.any((exp) => exp.category.id == categoryId);
  }

  List<Expense> getExpensesForPeriod(DateTime startDate, DateTime endDate) {
    return _expenses
        .where((exp) =>
            exp.date.isAfter(startDate.subtract(const Duration(days: 1))) &&
            exp.date.isBefore(endDate.add(const Duration(days: 1))))
        .toList();
  }

  Map<Category, double> getCategoryExpenses(List<Expense> expenses) {
    final Map<Category, double> categoryTotals = {};
    for (var expense in expenses) {
      categoryTotals.update(
        expense.category,
        (value) => value + expense.amount,
        ifAbsent: () => expense.amount,
      );
    }
    return categoryTotals;
  }
}

