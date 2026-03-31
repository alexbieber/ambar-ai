import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/category.dart';
import '../models/category.dart' show generateUuid;
import '../providers/category_provider.dart';
import '../providers/expense_provider.dart';

class CategoriesScreen extends StatelessWidget {
  const CategoriesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final categoryProvider = Provider.of<CategoryProvider>(context);
    final expenseProvider = Provider.of<ExpenseProvider>(context);
    final categories = categoryProvider.categories;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Expense Categories'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCategoryDialog(context, categoryProvider),
        icon: const Icon(Icons.add),
        label: const Text('Add Category'),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: categories.length,
        itemBuilder: (context, index) {
          final category = categories[index];
          final hasExpenses =
              expenseProvider.hasExpensesForCategory(category.id);
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              onTap: () => _showCategoryDialog(
                context,
                categoryProvider,
                category: category,
                canDelete: !hasExpenses,
              ),
              leading: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: category.color.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(Icons.category, color: category.color),
              ),
              title: Text(category.name),
              subtitle: hasExpenses
                  ? const Text('Has linked expenses')
                  : const Text('No expenses'),
              trailing: const Icon(Icons.chevron_right),
            ),
          );
        },
      ),
    );
  }

  Future<void> _showCategoryDialog(
    BuildContext context,
    CategoryProvider provider, {
    Category? category,
    bool canDelete = false,
  }) async {
    final isEditing = category != null;
    final nameController =
        TextEditingController(text: category?.name ?? '');
    Color selectedColor = category?.color ?? Colors.blue;

    await showDialog<void>(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: Text(isEditing ? 'Edit Category' : 'Add Category'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(
                    labelText: 'Name',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Color',
                  style: Theme.of(ctx).textTheme.bodyMedium,
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: provider.defaultColors
                      .map(
                        (c) => GestureDetector(
                          onTap: () {
                            selectedColor = c;
                            (ctx as Element).markNeedsBuild();
                          },
                          child: Container(
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(
                              color: c,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: selectedColor == c
                                    ? Colors.white
                                    : Colors.transparent,
                                width: 2,
                              ),
                            ),
                          ),
                        ),
                      )
                      .toList(),
                ),
              ],
            ),
          ),
          actions: [
            if (isEditing && canDelete)
              TextButton(
                onPressed: () {
                  provider.deleteCategory(category!.id);
                  Navigator.of(ctx).pop();
                },
                child: const Text('Delete'),
              ),
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                final name = nameController.text.trim();
                if (name.isEmpty) {
                  Navigator.of(ctx).pop();
                  return;
                }
                if (isEditing) {
                  provider.updateCategory(
                    Category(
                      id: category!.id,
                      name: name,
                      colorValue: selectedColor.value,
                    ),
                  );
                } else {
                  provider.addCategory(
                    Category(
                      id: generateUuid(),
                      name: name,
                      colorValue: selectedColor.value,
                    ),
                  );
                }
                Navigator.of(ctx).pop();
              },
              child: Text(isEditing ? 'Save' : 'Add'),
            ),
          ],
        );
      },
    );
  }
}
