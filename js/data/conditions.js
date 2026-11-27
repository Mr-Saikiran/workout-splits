// Health-condition guidance for the Diet and Recipes tabs: type 2 diabetes,
// PCOS, high blood pressure and hypothyroidism. Each food or recipe gets a
// "good", "limit" or "note" badge with the reason. Guidance, not treatment:
// the app says to follow the user's doctor or dietitian.
(function (WS) {
  WS.CONDITIONS = {
    diabetes: {
      label: 'Type 2 diabetes / prediabetes',
      summary: 'Build meals around vegetables, pulses, whole grains and lean protein; keep refined carbs and sugary foods small; spread carbs through the day. Weight loss of 5–10% improves blood sugar if you carry extra weight.',
      tips: ['Pair carbs with protein, fat or fibre to blunt blood-sugar spikes.', 'Choose low-GI carbs (pulses, oats, most fruit) over white rice, white bread and potatoes.', 'Strength training improves insulin sensitivity: keep lifting.'],
      refs: ['ada2024', 'atkinson2008'],
    },
    pcos: {
      label: 'PCOS',
      summary: 'No single diet is proven best for PCOS. The guideline recommends healthy eating and regular exercise for overall health and weight management; lower-GI, high-fibre meals with enough protein help many people with insulin resistance.',
      tips: ['Combine strength training and cardio most days.', 'Favour low-GI carbs and plenty of fibre; keep sugary foods occasional.', 'Omega-3-rich foods (oily fish, walnuts, chia) support heart health.'],
      refs: ['teede2023', 'atkinson2008'],
    },
    hypertension: {
      label: 'High blood pressure',
      summary: 'The DASH eating plan (vegetables, fruit, low-fat dairy, whole grains, pulses, nuts) lowers blood pressure, and cutting salt lowers it further. Aim for under about 2,300 mg sodium a day, ideally 1,500 mg.',
      tips: ['Watch sauces and packaged foods: soy sauce, miso, stock cubes, cheese and canned foods carry most of the salt.', 'Eat potassium-rich foods (vegetables, fruit, beans, potatoes, yogurt).', 'Keep saturated fat (ghee, butter, fatty meat) modest.'],
      refs: ['appel1997', 'sacks2001'],
    },
    thyroid: {
      label: 'Hypothyroidism (thyroid)',
      summary: 'There is no special thyroid diet. If you take levothyroxine, take it on an empty stomach and keep calcium, iron, soy and coffee about 4 hours apart from it. Get enough iodine and selenium, but don\'t overdo seaweed or iodine supplements.',
      tips: ['Take thyroid medication 30–60 minutes before breakfast, with water only.', 'Separate calcium- and iron-rich foods or supplements from the tablet by about 4 hours.', 'Cooked cruciferous vegetables (broccoli, cabbage) are fine in normal amounts.'],
      refs: ['jonklaas2014'],
    },
  };

  // Food properties used by the rules (GI from the international GI tables).
  const F = {
    gi: {
      high: ['white-rice', 'potato', 'wholewheat-bread', 'sweet-potato'],
      med: ['brown-rice', 'oats', 'atta', 'ragi', 'soba', 'banana', 'mango', 'papaya'],
      low: ['quinoa', 'lentils', 'chickpeas', 'rajma', 'black-beans', 'moong', 'soybeans', 'peas', 'edamame', 'apple', 'orange', 'guava', 'kiwi', 'strawberries', 'blueberries', 'amla'],
    },
    sugar: ['dates', 'dark-chocolate', 'baked-beans'],
    salt: ['miso', 'cheddar', 'baked-beans', 'cottage-cheese'],
    satfat: ['ghee', 'butter', 'coconut', 'cheddar', 'lamb', 'paneer', 'dark-chocolate'],
    soy: ['tofu', 'tempeh', 'soybeans', 'edamame', 'soy-chunks', 'natto', 'miso', 'soy-milk'],
    iodineHigh: ['wakame'],
    selenium: ['egg', 'salmon', 'tuna', 'sardines', 'cod', 'mackerel', 'shrimp', 'tilapia', 'sunflower-seeds', 'chicken-breast', 'oysters'],
  };
  const has = (list, id) => list.includes(id);
  const giOf = (id) => (has(F.gi.high, id) ? 'high' : has(F.gi.med, id) ? 'med' : has(F.gi.low, id) ? 'low' : null);

  // { level: 'good' | 'limit' | 'note', why } or null.
  WS.foodAdvice = function foodAdvice(food, cond) {
    if (!cond) return null;
    const id = food.id, gi = giOf(id), rich = food.rich;
    if (cond === 'diabetes' || cond === 'pcos') {
      if (gi === 'high') return { level: 'limit', why: 'High GI: small portions, paired with protein and fibre' };
      if (has(F.sugar, id)) return { level: 'limit', why: 'Sugar-dense: keep to small amounts' };
      if (gi === 'med') return { level: 'note', why: 'Medium GI: keep portions moderate' };
      if (gi === 'low' || (food.fib || 0) >= 5) return { level: 'good', why: 'Low GI / high fibre: steadier blood sugar' };
      if (food.c <= 10 && food.p >= 10) return { level: 'good', why: 'Protein with almost no carbs' };
      if (cond === 'pcos' && rich.includes('omega3')) return { level: 'good', why: 'Omega-3 source' };
      return null;
    }
    if (cond === 'hypertension') {
      if (has(F.salt, id)) return { level: 'limit', why: 'High in salt' };
      if (has(F.satfat, id)) return { level: 'limit', why: 'High in saturated fat' };
      const dash = ['potassium', 'magnesium', 'calcium'].filter((n) => rich.includes(n));
      if (dash.length) return { level: 'good', why: `DASH-friendly: rich in ${dash.join(', ')}` };
      if (food.diet === 'vegan' && food.kcal < 120 && food.c > 0) return { level: 'good', why: 'Vegetable or fruit: the core of DASH' };
      return null;
    }
    if (cond === 'thyroid') {
      if (has(F.iodineHigh, id)) return { level: 'limit', why: 'Very high in iodine: small portions only' };
      if (has(F.soy, id)) return { level: 'note', why: 'Soy: take thyroid medication about 4 h apart' };
      if (rich.includes('calcium') || rich.includes('iron')) return { level: 'note', why: 'Calcium / iron: keep about 4 h away from levothyroxine' };
      if (has(F.selenium, id) || rich.includes('iodine')) return { level: 'good', why: 'Selenium / iodine source' };
      return null;
    }
    return null;
  };

  const count = (text, words) => words.filter((w) => text.includes(w)).length;
  const REFINED = ['cooked rice', 'basmati', 'white rice', 'rice (dry)', 'bread', ' bun', 'naan', 'sourdough', 'panko', 'potato', 'pav'];
  const SUGARY = ['sugar', 'honey', 'mirin', 'teriyaki', 'sweet chilli'];
  const SALTY = ['soy sauce', 'oyster sauce', 'miso', 'roux', 'doubanjiang', 'chilli bean', 'stock', 'parmesan', 'feta', 'cheese', 'salsa', 'teriyaki', 'pickled'];
  const DAIRY_CALCIUM = ['yogurt', 'milk', 'paneer', 'cheese', 'curd'];

  WS.recipeAdvice = function recipeAdvice(r, cond) {
    if (!cond) return null;
    const text = ' ' + r.ingredients.join(' ').toLowerCase().replace(/brown rice/g, '').replace(/whole-wheat (pasta|wrap)/g, '');
    if (cond === 'diabetes' || cond === 'pcos') {
      const refined = count(text, REFINED), sugary = count(text, SUGARY);
      if ((refined || sugary) && r.c > 55) return { level: 'limit', why: 'Lots of refined or sugary carbs: halve the rice/bread and add vegetables' };
      if (r.c <= 35 && r.p >= 25) return { level: 'good', why: 'High protein, moderate carbs' };
      if (refined) return { level: 'note', why: 'Swap white rice or bread for brown rice, quinoa or extra veg' };
      return null;
    }
    if (cond === 'hypertension') {
      const salty = count(text, SALTY);
      if (salty >= 2) return { level: 'limit', why: 'Several salty ingredients: use low-sodium versions and less' };
      if (salty === 1) return { level: 'note', why: 'Contains a salty sauce or cheese: go easy, or use a low-sodium version' };
      return { level: 'good', why: 'No high-salt sauces; season with herbs, garlic, lemon' };
    }
    if (cond === 'thyroid') {
      if (r.main.includes('soy')) return { level: 'note', why: 'Soy-based: take thyroid medication about 4 h apart' };
      if (count(text, DAIRY_CALCIUM)) return { level: 'note', why: 'Contains dairy calcium: eat it 4 h away from levothyroxine' };
      if (r.main.includes('egg') || r.main.includes('fish')) return { level: 'good', why: 'Eggs / fish provide selenium and iodine' };
      return null;
    }
    return null;
  };

  WS.adviceBadge = (a, esc) => (a
    ? `<p class="advice advice-${a.level}"><b>${a.level === 'good' ? '✓ Good choice' : a.level === 'limit' ? '⚠ Limit' : 'ℹ Note'}</b> ${esc(a.why)}</p>` : '');

  WS.conditionCard = (cond, cite, esc) => {
    const c = WS.CONDITIONS[cond];
    if (!c) return '';
    return `<div class="card note condition-card"><h4>${esc(c.label)}</h4><p>${esc(c.summary)}</p>
      <ul>${c.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <p class="small muted">General guidance only: follow your doctor or dietitian, especially on medication timing. ${cite(c.refs)}</p></div>`;
  };
})(window.WS = window.WS || {});
