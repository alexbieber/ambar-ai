import 'package:flutter_test/flutter_test.dart';

import 'package:finance_tracker_app/models/category.dart';
import 'package:finance_tracker_app/models/expense.dart';
import 'package:finance_tracker_app/providers/expense_provider.dart';

void main() {
  group('ExpenseProvider', () {
    late ExpenseProvider provider;
    late Category food;
    late Category transport;

    setUp(() {
      provider = ExpenseProvider();
      food = Category(id: 'food', name: 'Food', colorValue: 0xFFFF0000);
      transport =
          Category(id: 'transport', name: 'Transport', colorValue: 0xFF0000FF);

      final now = DateTime(2025, 1, 15);
      provider
        ..addExpense(
          Expense(
            id: '1',
            title: 'Groceries',
            amount: 50,
            date: now,
            category: food,
          ),
        )
        ..addExpense(
          Expense(
            id: '2',
            title: 'Bus',
            amount: 10,
            date: now.subtract(const Duration(days: 10)),
            category: transport,
          ),
        );
    });

    test('totalExpenses sums all amounts', () {
      expect(provider.totalExpenses, 60);
    });

    test('getExpensesForPeriod filters by date range', () {
      final start = DateTime(2025, 1, 14);
      final end = DateTime(2025, 1, 16);

      final results = provider.getExpensesForPeriod(start, end);
      expect(results.length, 1);
      expect(results.first.title, 'Groceries');
    });

    test('getCategoryExpenses aggregates per category', () {
      final totals = provider.getCategoryExpenses(provider.expenses);
      expect(totals[food], 50);
      expect(totals[transport], 10);
    });

    test('hasExpensesForCategory reports correctly', () {
      expect(provider.hasExpensesForCategory(food.id), isTrue);
      expect(provider.hasExpensesForCategory('nonexistent'), isFalse);
    });
  });
}

