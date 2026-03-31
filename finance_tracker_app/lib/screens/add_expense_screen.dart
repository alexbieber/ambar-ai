import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../models/expense.dart';
import '../models/category.dart';
import '../models/category.dart' show generateUuid;
import '../providers/category_provider.dart';
import '../providers/expense_provider.dart';

class AddExpenseScreen extends StatefulWidget {
  AddExpenseScreen({super.key});

  @override
  State<AddExpenseScreen> createState() => _AddExpenseScreenState();
}

class _AddExpenseScreenState extends State<AddExpenseScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _amountController = TextEditingController();
  Category? _selectedCategory;
  DateTime _selectedDate = DateTime.now();

  @override
  void dispose() {
    _titleController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final categoryProvider = Provider.of<CategoryProvider>(context);
    final expenseProvider = Provider.of<ExpenseProvider>(context);
    final categories = categoryProvider.categories;
    if (categories.isNotEmpty && _selectedCategory == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        setState(() {
          _selectedCategory = categories.first;
        });
      });
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Expense'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Title',
                  border: OutlineInputBorder(),
                  hintText: 'e.g. Groceries',
                ),
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? 'Enter a title' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _amountController,
                decoration: const InputDecoration(
                  labelText: 'Amount (\$)',
                  border: OutlineInputBorder(),
                ),
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Enter amount';
                  if (double.tryParse(v) == null ||
                      double.parse(v) <= 0) {
                    return 'Enter a valid amount';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<Category>(
                value: _selectedCategory,
                decoration: const InputDecoration(
                  labelText: 'Category',
                  border: OutlineInputBorder(),
                ),
                items: categories
                    .map(
                      (c) => DropdownMenuItem<Category>(
                        value: c,
                        child: Row(
                          children: [
                            Container(
                              width: 16,
                              height: 16,
                              decoration: BoxDecoration(
                                color: c.color,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(c.name),
                          ],
                        ),
                      ),
                    )
                    .toList(),
                onChanged: (c) => setState(() => _selectedCategory = c),
              ),
              const SizedBox(height: 16),
              ListTile(
                title: const Text('Date'),
                subtitle: Text(DateFormat.yMMMd().format(_selectedDate)),
                trailing: const Icon(Icons.calendar_today),
                onTap: () async {
                  final d = await showDatePicker(
                    context: context,
                    initialDate: _selectedDate,
                    firstDate: DateTime(2000),
                    lastDate: DateTime.now(),
                  );
                  if (d != null) setState(() => _selectedDate = d);
                },
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () {
                  if (!_formKey.currentState!.validate() ||
                      _selectedCategory == null) return;
                  final expense = Expense(
                    id: generateUuid(),
                    title: _titleController.text.trim(),
                    amount:
                        double.parse(_amountController.text.trim()),
                    date: _selectedDate,
                    category: _selectedCategory!,
                  );
                  expenseProvider.addExpense(expense);
                  _titleController.clear();
                  _amountController.clear();
                  setState(() => _selectedDate = DateTime.now());
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Expense added')),
                  );
                },
                icon: const Icon(Icons.add),
                label: const Text('Add Expense'),
                style: FilledButton.styleFrom(
                  padding:
                      const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

