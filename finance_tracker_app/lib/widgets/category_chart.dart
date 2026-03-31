import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../models/category.dart';

class CategoryChart extends StatelessWidget {
  final Map<Category, double> categoryTotals;
  final double totalAmount;

  const CategoryChart({
    super.key,
    required this.categoryTotals,
    required this.totalAmount,
  });

  @override
  Widget build(BuildContext context) {
    if (categoryTotals.isEmpty || totalAmount == 0) {
      return Container(
        height: 200,
        alignment: Alignment.center,
        child: Text(
          'No expenses to display in chart.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
      );
    }

    return SizedBox(
      height: 250,
      child: Card(
        elevation: 2,
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Row(
            children: [
              Expanded(
                flex: 3,
                child: PieChart(
                  PieChartData(
                    sections: _buildChartSections(context),
                    borderData: FlBorderData(show: false),
                    sectionsSpace: 2,
                    centerSpaceRadius: 40,
                    pieTouchData: PieTouchData(enabled: false),
                  ),
                ),
              ),
              Expanded(
                flex: 2,
                child: Padding(
                  padding: const EdgeInsets.only(left: 8.0),
                  child: ListView.builder(
                    itemCount: categoryTotals.length,
                    itemBuilder: (context, index) {
                      final category = categoryTotals.keys.elementAt(index);
                      final amount = categoryTotals.values.elementAt(index);
                      final percentage =
                          totalAmount > 0 ? (amount / totalAmount * 100) : 0.0;
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4.0),
                        child: Row(
                          children: [
                            Container(
                              width: 10,
                              height: 10,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: category.color,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                category.name,
                                style: Theme.of(context).textTheme.bodySmall,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            Text(
                              '${percentage.toStringAsFixed(1)}%',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<PieChartSectionData> _buildChartSections(BuildContext context) {
    return categoryTotals.entries.map((entry) {
      final category = entry.key;
      final amount = entry.value;
      final percentage =
          totalAmount > 0 ? (amount / totalAmount * 100) : 0.0;
      return PieChartSectionData(
        color: category.color,
        value: amount,
        title: '${percentage.toStringAsFixed(0)}%',
        radius: 50,
        titleStyle: Theme.of(context).textTheme.bodySmall!.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
        badgeWidget: percentage > 5
            ? null
            : Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: category.color.withOpacity(0.8),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  category.name,
                  style: Theme.of(context).textTheme.bodySmall!.copyWith(
                        color: Colors.white,
                        fontSize: 8,
                      ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
      );
    }).toList();
  }
}

